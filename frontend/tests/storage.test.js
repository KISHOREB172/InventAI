import assert from "node:assert/strict";
import test from "node:test";
import { clearAllAppData, clearTransientAppData, loadProjects, saveProjects } from "../src/utils/storage.js";

class MemoryStorage {
  constructor() { this.values = new Map(); }
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  removeItem(key) { this.values.delete(key); }
  setItem(key, value) { this.values.set(key, String(value)); }
}

globalThis.localStorage = new MemoryStorage();

test.beforeEach(() => localStorage.clear());

test("loadProjects rejects malformed and incomplete saved records", () => {
  localStorage.setItem("inventai-projects", "not-json");
  assert.deepEqual(loadProjects(), []);
  localStorage.setItem("inventai-projects", JSON.stringify([{ id: 1 }, { id: 2, idea: "Brief", result: { title: "Valid" } }]));
  assert.deepEqual(loadProjects().map((project) => project.id), [2]);
});

test("saveProjects keeps only the 30 most recent records", () => {
  const projects = Array.from({ length: 35 }, (_, index) => ({ id: index + 1, idea: `Idea ${index}`, result: {} }));
  assert.equal(saveProjects(projects), true);
  assert.equal(JSON.parse(localStorage.getItem("inventai-projects")).length, 30);
});

test("loadProjects bounds legacy project and version collections", () => {
  const projects = Array.from({ length: 35 }, (_, index) => ({
    id: index + 1,
    idea: `Idea ${index}`,
    result: {},
    versions: Array.from({ length: 12 }, (__, version) => ({ version })),
  }));
  localStorage.setItem("inventai-projects", JSON.stringify(projects));
  const loaded = loadProjects();
  assert.equal(loaded.length, 30);
  assert.equal(loaded[0].versions.length, 8);
  assert.equal(loaded[0].versions[0].version, 4);
});

test("transient reset preserves intentional profile and project data", () => {
  localStorage.setItem("inventai-profile", "profile");
  localStorage.setItem("inventai-projects", "projects");
  localStorage.setItem("inventai-draft", "draft");
  localStorage.setItem("inventai-last-analysis", "analysis");
  clearTransientAppData();
  assert.equal(localStorage.getItem("inventai-profile"), "profile");
  assert.equal(localStorage.getItem("inventai-projects"), "projects");
  assert.equal(localStorage.getItem("inventai-draft"), null);
  assert.equal(localStorage.getItem("inventai-last-analysis"), null);
});

test("clearAllAppData removes only InventAI-owned keys", () => {
  localStorage.setItem("inventai-profile", "profile");
  localStorage.setItem("another-app", "keep");
  clearAllAppData();
  assert.equal(localStorage.getItem("inventai-profile"), null);
  assert.equal(localStorage.getItem("another-app"), "keep");
});
