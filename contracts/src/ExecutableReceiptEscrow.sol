// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title ExecutableReceiptEscrow
/// @notice Canonical financial state for Executable Receipts on Arc.
library SafeERC20 {
    error SafeERC20FailedOperation(address token);
    function safeTransfer(IERC20 token, address to, uint256 value) internal { _call(token, abi.encodeCall(token.transfer, (to, value))); }
    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal { _call(token, abi.encodeCall(token.transferFrom, (from, to, value))); }
    function _call(IERC20 token, bytes memory data) private {
        (bool success, bytes memory result) = address(token).call(data);
        if (!success || (result.length != 0 && !abi.decode(result, (bool)))) revert SafeERC20FailedOperation(address(token));
    }
}

contract ExecutableReceiptEscrow {
    using SafeERC20 for IERC20;
    enum OrderStatus { NONE, PAID, REFUND_REQUESTED, CANCELLED, REFUNDED, FINALIZED, DISPUTED }

    struct Order {
        uint256 id;
        address buyer;
        address merchant;
        address claimOwner;
        uint256 amount;
        uint64 createdAt;
        uint64 cancelBefore;
        uint64 refundBefore;
        OrderStatus status;
        bool transferable;
    }

    IERC20 public immutable usdc;
    address public owner;
    address public merchant;
    uint64 public cancelWindow = 15 minutes;
    uint64 public refundWindow = 15 minutes;
    uint256 public nextOrderId = 1;
    uint256 public totalEscrowed;
    uint256 private locked;
    mapping(uint256 => uint256) public productPrice;
    mapping(uint256 => bool) public productTransferable;
    mapping(uint256 => Order) private orders;

    event OrderCreated(uint256 indexed orderId, address indexed buyer, address indexed merchant, uint256 amount, uint64 cancelBefore, uint64 refundBefore, bool transferable);
    event OrderCancelled(uint256 indexed orderId, address indexed actor, uint256 amount);
    event RefundRequested(uint256 indexed orderId, address indexed actor);
    event RefundApproved(uint256 indexed orderId, uint256 amount);
    event ClaimTransferred(uint256 indexed orderId, address indexed previousOwner, address indexed newOwner);
    event OrderFinalized(uint256 indexed orderId, uint256 amount);

    error Unauthorized();
    error InvalidState();
    error DeadlinePassed();
    error DeadlinePending();
    error InvalidAddress();
    error InvalidWindows();
    error UnknownProduct();
    error ReentrantCall();

    modifier onlyOwner() { if (msg.sender != owner) revert Unauthorized(); _; }
    modifier onlyMerchant() { if (msg.sender != merchant) revert Unauthorized(); _; }
    modifier nonReentrant() { if (locked == 1) revert ReentrantCall(); locked = 1; _; locked = 0; }

    constructor(address usdc_, address merchant_) {
        if (usdc_ == address(0) || merchant_ == address(0)) revert InvalidAddress();
        usdc = IERC20(usdc_);
        merchant = merchant_;
        owner = msg.sender;
        productPrice[1] = 49_000_000; // 49 USDC, ERC-20 6 decimals
        productTransferable[1] = true;
    }

    function setProduct(uint256 productId, uint256 price, bool transferable) external onlyOwner {
        if (price == 0) revert UnknownProduct();
        productPrice[productId] = price;
        productTransferable[productId] = transferable;
    }

    function setWindows(uint64 cancelWindow_, uint64 refundWindow_) external onlyOwner {
        if (cancelWindow_ > refundWindow_ || refundWindow_ == 0) revert InvalidWindows();
        cancelWindow = cancelWindow_;
        refundWindow = refundWindow_;
    }

    function purchase(uint256 productId) external nonReentrant returns (uint256 orderId) {
        uint256 amount = productPrice[productId];
        if (amount == 0) revert UnknownProduct();
        orderId = nextOrderId++;
        uint64 now_ = uint64(block.timestamp);
        Order memory order = Order({
            id: orderId, buyer: msg.sender, merchant: merchant, claimOwner: msg.sender,
            amount: amount, createdAt: now_, cancelBefore: now_ + cancelWindow,
            refundBefore: now_ + refundWindow, status: OrderStatus.PAID,
            transferable: productTransferable[productId]
        });
        orders[orderId] = order;
        totalEscrowed += amount;
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        emit OrderCreated(orderId, msg.sender, merchant, amount, order.cancelBefore, order.refundBefore, order.transferable);
    }

    function cancel(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        if (order.status != OrderStatus.PAID) revert InvalidState();
        if (msg.sender != order.claimOwner) revert Unauthorized();
        if (block.timestamp >= order.cancelBefore) revert DeadlinePassed();
        order.status = OrderStatus.CANCELLED;
        uint256 amount = order.amount;
        totalEscrowed -= amount;
        usdc.safeTransfer(order.buyer, amount);
        emit OrderCancelled(orderId, msg.sender, amount);
    }

    function requestRefund(uint256 orderId) external {
        Order storage order = orders[orderId];
        if (order.status != OrderStatus.PAID) revert InvalidState();
        if (msg.sender != order.claimOwner) revert Unauthorized();
        if (block.timestamp >= order.refundBefore) revert DeadlinePassed();
        order.status = OrderStatus.REFUND_REQUESTED;
        emit RefundRequested(orderId, msg.sender);
    }

    function approveRefund(uint256 orderId) external onlyMerchant nonReentrant {
        Order storage order = orders[orderId];
        if (order.status != OrderStatus.REFUND_REQUESTED) revert InvalidState();
        order.status = OrderStatus.REFUNDED;
        uint256 amount = order.amount;
        totalEscrowed -= amount;
        usdc.safeTransfer(order.buyer, amount);
        emit RefundApproved(orderId, amount);
    }

    function transferClaim(uint256 orderId, address newOwner) external {
        Order storage order = orders[orderId];
        if (order.status != OrderStatus.PAID || !order.transferable) revert InvalidState();
        if (msg.sender != order.claimOwner) revert Unauthorized();
        if (newOwner == address(0)) revert InvalidAddress();
        address previousOwner = order.claimOwner;
        order.claimOwner = newOwner;
        emit ClaimTransferred(orderId, previousOwner, newOwner);
    }

    function finalize(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        if (order.status != OrderStatus.PAID) revert InvalidState();
        if (block.timestamp < order.refundBefore) revert DeadlinePending();
        order.status = OrderStatus.FINALIZED;
        uint256 amount = order.amount;
        totalEscrowed -= amount;
        usdc.safeTransfer(order.merchant, amount);
        emit OrderFinalized(orderId, amount);
    }

    function getOrder(uint256 orderId) external view returns (Order memory) { return orders[orderId]; }

    function getAvailableActions(uint256 orderId, address actor) external view returns (uint8 bitmap) {
        Order memory order = orders[orderId];
        if (order.status != OrderStatus.PAID || actor != order.claimOwner) return 0;
        if (block.timestamp < order.cancelBefore) bitmap |= 1;
        if (order.transferable) bitmap |= 2;
        if (block.timestamp < order.refundBefore) bitmap |= 4;
    }
}
