# Contributing

Your contributions are always welcome!

## Guidelines

### General

Additions and changes should follow the intention of wrapping more complex use cases and standardizing frequently used functionality.

**All contributions should be tested before submitting a PR:**

- Run a full build via `build.sh`
- Paste the whole library in a new Code Resource
- Run the function to confirm that there's no error 500 due to syntax errors etc.

### When adding utility functions

- Make use of JSDoc style comments
- Make sure the function does not interfere with other functions (outside the scope of `_private.js`)
- Provide documentation for the added functionality in the README

### When making changes to existing functions

- Explain your reasons in your PR
