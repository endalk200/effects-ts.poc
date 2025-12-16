function add(a: number, b: number): number {
  return a + b;
}

const sum = add(1, 2);

console.log(sum);

function subtract(a: number, b: number): number {
  return a - b;
}

const difference = subtract(5, 2);

console.log(difference);

function multiply(a: number, b: number): number {
  return a * b;
}

const product = multiply(3, 4);

console.log(product);

function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error("Cannot divide by zero");
  }

  return a / b;
}

const quotient = divide(6, 3);

console.log(quotient);

class ErrorDivideByZero extends Error {
  constructor() {
    super("Cannot divide by zero");
    this.name = "ErrorDivideByZero";
  }
}

function divideWithCustomError(a: number, b: number): number {
  if (b === 0) {
    throw new ErrorDivideByZero();
  }

  return a / b;
}

try {
  const quotientWithCustomError = divideWithCustomError(6, 0);
  console.log(quotientWithCustomError);
} catch (error) {
  console.log(error);
}
