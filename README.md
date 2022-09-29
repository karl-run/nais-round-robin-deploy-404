# PoC for reproducing 404 error when deployng to nais

## Run the test

This must be executed directly from the terminal, or else each process doesn't know which process index it is. The last number is how many parallel processes should run. Edit index.js to adjust how many iterations there should be.

```bash
parallel --ungroup npm run start  ::: {1..5}
```
