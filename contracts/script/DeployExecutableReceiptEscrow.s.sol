// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Script, console2} from "forge-std/Script.sol";
import {ExecutableReceiptEscrow} from "../src/ExecutableReceiptEscrow.sol";
contract DeployExecutableReceiptEscrow is Script {
    address constant ARC_USDC = 0x3600000000000000000000000000000000000000;
    function run() external returns (ExecutableReceiptEscrow escrow) {
        uint256 key = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address merchant = vm.envAddress("MERCHANT_ADDRESS");
        uint64 cancelWindow = uint64(vm.envOr("CANCEL_WINDOW_SECONDS", uint256(900)));
        uint64 refundWindow = uint64(vm.envOr("REFUND_WINDOW_SECONDS", uint256(900)));
        vm.startBroadcast(key);
        escrow = new ExecutableReceiptEscrow(ARC_USDC, merchant);
        escrow.setWindows(cancelWindow, refundWindow);
        vm.stopBroadcast();
        console2.log("ExecutableReceiptEscrow", address(escrow));
        console2.log("Merchant", merchant);
        console2.log("Arc USDC", ARC_USDC);
    }
}
