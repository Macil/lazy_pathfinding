export interface CostOptions<Cost> {
  /**
   * Cost value for the initial node.
   */
  zero: Cost;
  /**
   * Function to add cost values.
   */
  add: (a: Cost, b: Cost) => Cost;
  /**
   * Function used to determine the order of the elements. It is expected to return
   * a negative value if the first argument is less than the second argument, zero if they're equal, and a positive
   * value otherwise.
   */
  compareFn: (a: Cost, b: Cost) => number;
}

export const numberCostOptions: CostOptions<number> = {
  zero: 0,
  add: (a, b) => a + b,
  compareFn: (a, b) => a - b,
};
