const methods = ["get","post","put","patch","delete","options","head"];
export function listOperations(spec) {
  if (!spec || typeof spec !== "object" || !spec.paths) throw new TypeError("A valid OpenAPI document with paths is required");
  const operations = [];
  for (const [path, item] of Object.entries(spec.paths)) for (const method of methods) {
    const operation = item?.[method]; if (!operation) continue;
    operations.push({ method: method.toUpperCase(), path, operationId: operation.operationId ?? operationId(method, path), summary: operation.summary ?? "", tags: operation.tags ?? [], parameters: [...(item.parameters ?? []), ...(operation.parameters ?? [])], responses: operation.responses ?? {} });
  }
  return operations;
}
export function operationId(method, path) {
  const parts = path.replace(/[{}]/g, "").split("/").filter(Boolean).map(x => x.replace(/[^a-zA-Z0-9]/g, " "));
  return [method.toLowerCase(), ...parts].map((x,i)=>i===0?x:x.split(/\s+/).map(w=>w[0]?.toUpperCase()+w.slice(1)).join("")).join("");
}
export function toRoutePath(openapiPath) { return openapiPath.replace(/\{([^}]+)\}/g, ":$1"); }
export function findSchema(spec, name) {
  const schema = spec?.components?.schemas?.[name];
  if (!schema) throw new Error("Schema not found: " + name);
  return structuredClone(schema);
}
export function summarizeSpec(spec) {
  const operations = listOperations(spec);
  return { title: spec.info?.title ?? "Untitled API", version: spec.info?.version ?? "unknown", servers: (spec.servers ?? []).map(s => s.url), operationCount: operations.length, methods: [...new Set(operations.map(x=>x.method))], tags: [...new Set(operations.flatMap(x=>x.tags))], operations };
}
export function validateDocument(spec) {
  const errors = [];
  if (!spec || typeof spec !== "object") return { valid:false, errors:["Document must be an object"] };
  if (!spec.openapi?.startsWith("3.")) errors.push("openapi must specify an OpenAPI 3.x version");
  if (!spec.info?.title) errors.push("info.title is required");
  if (!spec.info?.version) errors.push("info.version is required");
  if (!spec.paths || typeof spec.paths !== "object") errors.push("paths must be an object");
  return { valid: errors.length === 0, errors };
}