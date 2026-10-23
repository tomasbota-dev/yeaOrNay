import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(
  new URL("../frontend/i18n.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpile(source, {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2022,
});
const context = { exports: {}, require: () => ({}) };
vm.runInNewContext(compiled, context);
const { translate, translateError, normalizeLocale, portuguese } =
  context.exports;

test("Portuguese templates retain and interpolate every named parameter", () => {
  const parameters = (value) =>
    [...value.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)]
      .map((match) => match[1])
      .sort();
  for (const [english, portugueseText] of Object.entries(portuguese)) {
    assert.deepEqual(parameters(portugueseText), parameters(english), english);
  }
  assert.equal(
    translate("pt-PT", "Vote against {title}", { title: "<Pizza>" }),
    "Votar contra «<Pizza>»",
  );
  assert.equal(translate("en-US", "{count} ideas", { count: 2 }), "2 ideas");
});

test("Every literal API error has an explicit Portuguese translation", () => {
  const backend = readFileSync(
    new URL("../src/index.ts", import.meta.url),
    "utf8",
  );
  const errors = [
    ...backend.matchAll(/(?:new HttpError|return fail)\('([^']+)'/g),
  ].map((match) => match[1]);
  assert.ok(errors.length > 20);
  for (const error of errors)
    assert.ok(Object.hasOwn(portuguese, error), error);
  for (const [field, max] of [
    ["Name", 40],
    ["Email", 254],
    ["Room name", 70],
    ["Room code", 8],
    ["Member", 64],
    ["Idea", 100],
    ["Comment", 280],
  ]) {
    assert.notEqual(
      translateError(`${field} is required.`, "pt-PT"),
      translate("pt-PT", "Something went wrong. Please try again."),
    );
    assert.match(
      translateError(
        `${field} must be between 1 and ${max} characters.`,
        "pt-PT",
      ),
      new RegExp(`entre 1 e ${max}`),
    );
  }
});

test("Invalid locales and unknown server errors have safe language-aware fallbacks", () => {
  assert.equal(normalizeLocale("invalid"), "en-US");
  assert.equal(normalizeLocale("pt-BR"), "pt-PT");
  assert.equal(
    translateError("Unexpected internal diagnostic", "pt-PT"),
    "Não foi possível concluir a ação. Tenta novamente.",
  );
  assert.equal(
    translateError("", "en-US"),
    "Something went wrong. Please try again.",
  );
});

test("Every literal React UI translation key has Portuguese coverage", () => {
  const keys = new Set();
  function translatedChoices(expression) {
    if (!expression) return;
    if (
      ts.isStringLiteral(expression) ||
      ts.isNoSubstitutionTemplateLiteral(expression)
    )
      keys.add(expression.text);
    else if (ts.isConditionalExpression(expression)) {
      translatedChoices(expression.whenTrue);
      translatedChoices(expression.whenFalse);
    }
  }
  for (const file of ["App.tsx", "legal.tsx"]) {
    const text = readFileSync(
      new URL(`../frontend/${file}`, import.meta.url),
      "utf8",
    );
    const ast = ts.createSourceFile(
      file,
      text,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    function walk(node) {
      if (ts.isCallExpression(node) && node.expression.getText(ast) === "t")
        translatedChoices(node.arguments[0]);
      // App's duration options, feedback ratings, and landing stages use [value, label] arrays.
      if (
        file === "App.tsx" &&
        ts.isArrayLiteralExpression(node) &&
        node.elements.length &&
        node.elements.every(
          (item) =>
            ts.isArrayLiteralExpression(item) && item.elements.length === 2,
        )
      ) {
        for (const pair of node.elements) translatedChoices(pair.elements[1]);
      }
      ts.forEachChild(node, walk);
    }
    walk(ast);
  }
  assert.ok(keys.size > 150);
  assert.deepEqual(
    [...keys].filter((key) => !Object.hasOwn(portuguese, key)),
    [],
    "Missing Portuguese UI text",
  );
});
