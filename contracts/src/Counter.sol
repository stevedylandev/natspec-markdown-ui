// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Counter
/// @notice A simple counter contract that allows incrementing and setting a number
/// @dev This contract maintains a single uint256 state variable that can be modified
contract Counter {
    /// @notice The current counter value
    /// @dev Public state variable automatically generates a getter function
    uint256 public number;

    /// @notice Sets the counter to a specific value
    /// @dev Updates the number state variable to the provided value
    /// @param newNumber The new value to set the counter to
    /// 
    /// ```markdown-ui-widget
    /// { "type": "form", "id": "setNumber", "submitLabel": "Set Number", "fields": [{ "type": "text-input", "id": "newValue", "label": "New Counter Value", "placeholder": "Enter number", "default": "42" }] }
    /// ```
    function setNumber(uint256 newNumber) public {
        number = newNumber;
    }

    /// @notice Increments the counter by 1
    /// @dev Increases the number state variable by 1 using the increment operator
    /// 
    /// ```markdown-ui-widget
    /// { "type": "form", "id": "increment", "submitLabel": "Increment", "fields": [] }
    /// ```
    function increment() public {
        number++;
    }
}


