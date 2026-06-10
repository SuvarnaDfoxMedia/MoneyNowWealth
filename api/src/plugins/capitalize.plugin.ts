import { Schema } from "mongoose";

/**
 * Capitalize first letter of string
 * AND first letter after a full stop for description fields
 */
const capitalizeText = (
  value?: string,
  isDescription: boolean = false,
): string => {
  if (!value || typeof value !== "string") return value || "";

  let result = value.trim();
  if (result.length === 0) return result;

  // Always capitalize first character
  result = result.charAt(0).toUpperCase() + result.slice(1);

  // Only capitalize after full stops for description-like fields
  if (isDescription) {
    // Capitalize letter after ". " (dot followed by space)
    result = result.replace(/\. (\w)/g, (_, char) => `. ${char.toUpperCase()}`);

    // Also handle cases where dot is followed immediately by letter (no space)
    result = result.replace(/\.(\w)/g, (_, char) => `.${char.toUpperCase()}`);
  }

  return result;
};

/**
 * Plugin options interface
 */
export interface CapitalizePluginOptions {
  // Fields to capitalize (defaults to all string fields if not specified)
  fields?: string[];
  // Fields to EXCLUDE from capitalization (SEO/slug fields go here)
  except?: string[];
  // Fields that should have sentence capitalization (after full stops)
  descriptionFields?: string[];
}

/**
 * Helper to process nested objects/arrays
 */
const processNestedObject = (
  obj: any,
  descriptionFields: string[],
  except: string[],
): any => {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      processNestedObject(item, descriptionFields, except),
    );
  }

  const result = { ...obj };

  Object.keys(result).forEach((key) => {
    const value = result[key];

    // Skip if in except list
    if (except.includes(key)) return;

    if (typeof value === "string") {
      const isDescription = descriptionFields.includes(key);
      result[key] = capitalizeText(value, isDescription);
    } else if (value && typeof value === "object") {
      // Recursively process nested objects
      result[key] = processNestedObject(value, descriptionFields, except);
    }
  });

  return result;
};

/**
 * Reusable Mongoose plugin to capitalize text fields
 */
export const capitalizePlugin = (
  schema: Schema,
  options: CapitalizePluginOptions = {},
) => {
  const { fields = [], except = [], descriptionFields = [] } = options;

  // Get all string fields from schema if no specific fields provided
  const getStringFields = (): string[] => {
    if (fields.length > 0) {
      return fields.filter((field) => !except.includes(field));
    }

    return Object.keys(schema.paths)
      .filter((path) => {
        const schemaType = schema.paths[path];
        return schemaType.instance === "String";
      })
      .filter((field) => !except.includes(field));
  };

  // Process a single field value
  const processFieldValue = (fieldName: string, value: any): any => {
    if (typeof value !== "string") {
      // If it's an object or array, process nested strings
      if (value && typeof value === "object") {
        return processNestedObject(value, descriptionFields, except);
      }
      return value;
    }

    // Don't process if field is in except list
    if (except.includes(fieldName)) return value;

    // Apply appropriate capitalization
    return capitalizeText(value, descriptionFields.includes(fieldName));
  };

  /* ---------- SAVE HOOK (Create & Save) ---------- */
  schema.pre("save", function (next) {
    const doc = this as any;
    const allFields = getStringFields();

    allFields.forEach((field) => {
      if (doc[field] !== undefined && doc[field] !== null) {
        doc[field] = processFieldValue(field, doc[field]);
      }
    });

    next();
  });

  /* ---------- UPDATE HOOKS ---------- */
  const updateHandler = function (this: any, next: () => void) {
    const update = this.getUpdate ? this.getUpdate() : null;
    if (!update) return next();

    const processUpdate = (updateObj: any) => {
      if (!updateObj || typeof updateObj !== "object") return;

      // Process $set operator
      if (updateObj.$set && typeof updateObj.$set === "object") {
        Object.keys(updateObj.$set).forEach((key) => {
          const value = updateObj.$set[key];
          if (value !== undefined && value !== null && !except.includes(key)) {
            updateObj.$set[key] = processFieldValue(key, value);
          }
        });
      }

      // Process direct updates (non-$set)
      Object.keys(updateObj).forEach((key) => {
        if (key.startsWith("$")) return;
        const value = updateObj[key];
        if (value !== undefined && value !== null && !except.includes(key)) {
          updateObj[key] = processFieldValue(key, value);
        }
      });
    };

    processUpdate(update);
    next();
  };

  // Register hooks
  (schema as any).pre("findOneAndUpdate", updateHandler);
  (schema as any).pre("updateOne", updateHandler);
  (schema as any).pre("updateMany", updateHandler);
  (schema as any).pre("findByIdAndUpdate", updateHandler);
};
