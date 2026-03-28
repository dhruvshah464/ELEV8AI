export function describeAppError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      details: {
        name: error.name,
        stack: error.stack,
      },
    };
  }

  if (error && typeof error === "object") {
    const details = Object.getOwnPropertyNames(error).reduce<Record<string, unknown>>(
      (accumulator, key) => {
        accumulator[key] = (error as Record<string, unknown>)[key];
        return accumulator;
      },
      {}
    );

    return {
      message:
        typeof details.message === "string"
          ? details.message
          : "Unexpected application error",
      details,
    };
  }

  return {
    message: typeof error === "string" ? error : "Unexpected application error",
    details: error,
  };
}

export function logAppError(label: string, error: unknown) {
  const serialized = describeAppError(error);
  console.error(label, serialized, JSON.stringify(serialized));
  return serialized;
}

export function logAppWarning(label: string, error: unknown) {
  const serialized = describeAppError(error);
  console.warn(label, serialized, JSON.stringify(serialized));
  return serialized;
}
