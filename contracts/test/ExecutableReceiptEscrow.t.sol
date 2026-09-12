// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "../src/ExecutableReceiptEscrow.sol";

interface Vm {
    function warp(uint256) external;
}

contract MockUSDC is IERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 n) external {
        balanceOf[to] += n;
    }

    function approve(address s, uint256 n) external returns (bool) {
        allowance[msg.sender][s] = n;
        return true;
    }

    function transfer(address to, uint256 n) external returns (bool) {
        require(balanceOf[msg.sender] >= n);
        balanceOf[msg.sender] -= n;
        balanceOf[to] += n;
        return true;
    }

    function transferFrom(address f, address to, uint256 n) external returns (bool) {
        require(allowance[f][msg.sender] >= n && balanceOf[f] >= n);
        allowance[f][msg.sender] -= n;
        balanceOf[f] -= n;
        balanceOf[to] += n;
        return true;
    }
}

contract Actor {
    function approve(IERC20 t, address s, uint256 n) external {
        MockUSDC(address(t)).approve(s, n);
    }

    function buy(ExecutableReceiptEscrow e, uint256 p) external returns (uint256) {
        return e.purchase(p);
    }

    function cancel(ExecutableReceiptEscrow e, uint256 id) external {
        e.cancel(id);
    }

    function refund(ExecutableReceiptEscrow e, uint256 id) external {
        e.requestRefund(id);
    }

    function transferClaim(ExecutableReceiptEscrow e, uint256 id, address to) external {
        e.transferClaim(id, to);
    }

    function approveRefund(ExecutableReceiptEscrow e, uint256 id) external {
        e.approveRefund(id);
    }
}

contract ExecutableReceiptEscrowTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    uint256 constant PRICE = 49_000_000;
    MockUSDC token;
    ExecutableReceiptEscrow escrow;
    Actor buyer;
    Actor other;

    function setUp() public {
        token = new MockUSDC();
        escrow = new ExecutableReceiptEscrow(address(token), address(this));
        buyer = new Actor();
        other = new Actor();
        token.mint(address(buyer), PRICE * 20);
        buyer.approve(token, address(escrow), type(uint256).max);
    }

    function buy() internal returns (uint256) {
        return buyer.buy(escrow, 1);
    }

    function fails(address target, bytes memory data) internal returns (bool) {
        (bool ok,) = target.call(data);
        return !ok;
    }

    function state(uint256 id) internal view returns (ExecutableReceiptEscrow.OrderStatus) {
        return escrow.getOrder(id).status;
    }

    function testPurchaseCanonicalStateAndFunding() public {
        uint256 t = block.timestamp;
        uint256 id = buy();
        ExecutableReceiptEscrow.Order memory o = escrow.getOrder(id);
        require(id == 1 && escrow.nextOrderId() == 2);
        require(o.buyer == address(buyer) && o.merchant == address(this) && o.claimOwner == address(buyer));
        require(
            o.amount == PRICE && o.createdAt == t && o.cancelBefore == t + 15 minutes
                && o.refundBefore == t + 15 minutes && o.transferable
        );
        require(token.balanceOf(address(escrow)) == PRICE && escrow.totalEscrowed() == PRICE);
    }

    function testUnknownProductReverts() public {
        require(fails(address(buyer), abi.encodeCall(buyer.buy, (escrow, 999))));
    }

    function testOrderIdsIncrement() public {
        require(buy() == 1 && buy() == 2 && escrow.nextOrderId() == 3);
    }

    function testClaimOwnerCancelsAndGetsExactRefund() public {
        uint256 before_ = token.balanceOf(address(buyer));
        uint256 id = buy();
        buyer.cancel(escrow, id);
        require(state(id) == ExecutableReceiptEscrow.OrderStatus.CANCELLED);
        require(token.balanceOf(address(buyer)) == before_ && escrow.totalEscrowed() == 0);
    }

    function testUnauthorizedCancelAndRefundFail() public {
        uint256 id = buy();
        require(fails(address(other), abi.encodeCall(other.cancel, (escrow, id))));
        require(fails(address(other), abi.encodeCall(other.refund, (escrow, id))));
    }

    function testOldOwnerLosesRightsAfterTransfer() public {
        uint256 id = buy();
        buyer.transferClaim(escrow, id, address(other));
        require(escrow.getOrder(id).claimOwner == address(other));
        require(
            escrow.getAvailableActions(id, address(buyer)) == 0 && escrow.getAvailableActions(id, address(other)) == 7
        );
        require(fails(address(buyer), abi.encodeCall(buyer.cancel, (escrow, id))));
    }

    function testCancelAtDeadlineAndDoubleCancelFail() public {
        uint256 a = buy();
        vm.warp(escrow.getOrder(a).cancelBefore);
        require(fails(address(buyer), abi.encodeCall(buyer.cancel, (escrow, a))));
        uint256 b = buy();
        buyer.cancel(escrow, b);
        require(fails(address(buyer), abi.encodeCall(buyer.cancel, (escrow, b))));
    }

    function testCancelAfterRefundRequestFails() public {
        uint256 id = buy();
        buyer.refund(escrow, id);
        require(fails(address(buyer), abi.encodeCall(buyer.cancel, (escrow, id))));
    }

    function testRefundLifecycleExactReturnAndNoDoubleRelease() public {
        uint256 id = buy();
        buyer.refund(escrow, id);
        require(state(id) == ExecutableReceiptEscrow.OrderStatus.REFUND_REQUESTED);
        uint256 before_ = token.balanceOf(address(buyer));
        escrow.approveRefund(id);
        require(
            state(id) == ExecutableReceiptEscrow.OrderStatus.REFUNDED
                && token.balanceOf(address(buyer)) == before_ + PRICE && escrow.totalEscrowed() == 0
        );
        require(fails(address(escrow), abi.encodeCall(escrow.approveRefund, (id))));
    }

    function testOnlyMerchantApprovesRefund() public {
        uint256 id = buy();
        buyer.refund(escrow, id);
        require(fails(address(other), abi.encodeCall(other.approveRefund, (escrow, id))));
    }

    function testRefundAtDeadlineFails() public {
        escrow.setWindows(5 minutes, 10 minutes);
        uint256 id = buy();
        vm.warp(escrow.getOrder(id).refundBefore);
        require(fails(address(buyer), abi.encodeCall(buyer.refund, (escrow, id))));
    }

    function testTransferValidation() public {
        uint256 id = buy();
        require(fails(address(other), abi.encodeCall(other.transferClaim, (escrow, id, address(other)))));
        require(fails(address(buyer), abi.encodeCall(buyer.transferClaim, (escrow, id, address(0)))));
        escrow.setProduct(2, PRICE, false);
        uint256 locked = buyer.buy(escrow, 2);
        require(fails(address(buyer), abi.encodeCall(buyer.transferClaim, (escrow, locked, address(other)))));
    }

    function testFinalizeAfterDeadlinePaysMerchantAndCannotRepeat() public {
        uint256 id = buy();
        require(fails(address(escrow), abi.encodeCall(escrow.finalize, (id))));
        vm.warp(escrow.getOrder(id).refundBefore);
        uint256 before_ = token.balanceOf(address(this));
        escrow.finalize(id);
        require(
            state(id) == ExecutableReceiptEscrow.OrderStatus.FINALIZED
                && token.balanceOf(address(this)) == before_ + PRICE && escrow.totalEscrowed() == 0
        );
        require(fails(address(escrow), abi.encodeCall(escrow.finalize, (id))));
    }

    function testFinalizeRejectsCancelledAndRefundRequested() public {
        uint256 a = buy();
        buyer.cancel(escrow, a);
        require(fails(address(escrow), abi.encodeCall(escrow.finalize, (a))));
        uint256 b = buy();
        buyer.refund(escrow, b);
        require(fails(address(escrow), abi.encodeCall(escrow.finalize, (b))));
    }

    function testAvailableActionsAcrossTimeAndOwners() public {
        escrow.setWindows(5 minutes, 10 minutes);
        uint256 id = buy();
        require(
            escrow.getAvailableActions(id, address(buyer)) == 7 && escrow.getAvailableActions(id, address(other)) == 0
        );
        vm.warp(escrow.getOrder(id).cancelBefore);
        require(escrow.getAvailableActions(id, address(buyer)) == 6);
        vm.warp(escrow.getOrder(id).refundBefore);
        require(escrow.getAvailableActions(id, address(buyer)) == 2);
        buyer.transferClaim(escrow, id, address(other));
        require(escrow.getAvailableActions(id, address(other)) == 2);
    }

    function testClosedStatesHaveNoActions() public {
        uint256 a = buy();
        buyer.cancel(escrow, a);
        require(escrow.getAvailableActions(a, address(buyer)) == 0);
        uint256 b = buy();
        buyer.refund(escrow, b);
        require(escrow.getAvailableActions(b, address(buyer)) == 0);
        escrow.approveRefund(b);
        require(escrow.getAvailableActions(b, address(buyer)) == 0);
        uint256 c = buy();
        vm.warp(escrow.getOrder(c).refundBefore);
        escrow.finalize(c);
        require(escrow.getAvailableActions(c, address(buyer)) == 0);
    }

    function testWindowInvariant() public {
        require(fails(address(escrow), abi.encodeCall(escrow.setWindows, (uint64(11), uint64(10)))));
    }

    function testMultipleOrderAccounting() public {
        uint256 a = buy();
        uint256 b = buy();
        require(escrow.totalEscrowed() == PRICE * 2);
        buyer.cancel(escrow, a);
        require(escrow.totalEscrowed() == PRICE);
        vm.warp(escrow.getOrder(b).refundBefore);
        escrow.finalize(b);
        require(escrow.totalEscrowed() == 0 && token.balanceOf(address(escrow)) == 0);
    }
}
