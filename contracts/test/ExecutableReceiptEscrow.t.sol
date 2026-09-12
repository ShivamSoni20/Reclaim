// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../src/ExecutableReceiptEscrow.sol";

contract MockUSDC is IERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    function mint(address to, uint256 amount) external { balanceOf[to] += amount; }
    function approve(address spender, uint256 amount) external returns (bool) { allowance[msg.sender][spender] = amount; return true; }
    function transfer(address to, uint256 amount) external returns (bool) { balanceOf[msg.sender] -= amount; balanceOf[to] += amount; return true; }
    function transferFrom(address from, address to, uint256 amount) external returns (bool) { allowance[from][msg.sender] -= amount; balanceOf[from] -= amount; balanceOf[to] += amount; return true; }
}

contract Buyer {
    function approve(IERC20 token, address spender, uint256 amount) external { MockUSDC(address(token)).approve(spender, amount); }
    function buy(ExecutableReceiptEscrow escrow) external returns (uint256) { return escrow.purchase(1); }
    function cancel(ExecutableReceiptEscrow escrow, uint256 id) external { escrow.cancel(id); }
    function transferClaim(ExecutableReceiptEscrow escrow, uint256 id, address to) external { escrow.transferClaim(id, to); }
}

contract ExecutableReceiptEscrowTest {
    MockUSDC token;
    ExecutableReceiptEscrow escrow;
    Buyer buyer;

    function setUp() public {
        token = new MockUSDC();
        escrow = new ExecutableReceiptEscrow(address(token), address(this));
        buyer = new Buyer();
        token.mint(address(buyer), 98_000_000);
        buyer.approve(token, address(escrow), type(uint256).max);
    }

    function testPurchaseAndCancelReturnsUSDC() public {
        setUp();
        uint256 id = buyer.buy(escrow);
        require(token.balanceOf(address(escrow)) == 49_000_000, "escrow not funded");
        buyer.cancel(escrow, id);
        require(token.balanceOf(address(buyer)) == 98_000_000, "refund missing");
        require(uint8(escrow.getOrder(id).status) == uint8(ExecutableReceiptEscrow.OrderStatus.CANCELLED), "wrong state");
    }

    function testClaimTransferChangesRights() public {
        setUp();
        uint256 id = buyer.buy(escrow);
        address recipient = address(0xB0B);
        buyer.transferClaim(escrow, id, recipient);
        require(escrow.getOrder(id).claimOwner == recipient, "owner not changed");
        require(escrow.getAvailableActions(id, address(buyer)) == 0, "old owner kept rights");
    }
}
