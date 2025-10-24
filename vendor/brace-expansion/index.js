// Minimal brace-expansion implementation to replace the vulnerable upstream package.
const RANGE_RE = /^(.*)\.\.(.*?)(?:\.\.(.*))?$/;

function isEscaped(str, index) {
  let count = 0;
  while (index > 0 && str.charCodeAt(index - 1) === 92) {
    count += 1;
    index -= 1;
  }
  return count % 2 === 1;
}

function splitComma(value) {
  const parts = [];
  let depth = 0;
  let last = 0;
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (char === "{" && !isEscaped(value, i)) {
      depth += 1;
    } else if (char === "}" && !isEscaped(value, i)) {
      if (depth > 0) {
        depth -= 1;
      }
    } else if (char === "," && depth === 0 && !isEscaped(value, i)) {
      parts.push(value.slice(last, i));
      last = i + 1;
    }
  }
  parts.push(value.slice(last));
  return parts.filter((part) => part.length > 0);
}

function expandRange(segment) {
  const match = RANGE_RE.exec(segment);
  if (!match) {
    return null;
  }
  const start = match[1];
  const end = match[2];
  const step = match[3] ? Number(match[3]) : undefined;
  const startNum = Number(start);
  const endNum = Number(end);
  const isNumeric = Number.isFinite(startNum) && Number.isFinite(endNum);
  if (isNumeric) {
    const actualStep = step ?? (startNum <= endNum ? 1 : -1);
    if (actualStep === 0) {
      return null;
    }
    const result = [];
    if (actualStep > 0) {
      for (let value = startNum; value <= endNum; value += actualStep) {
        result.push(String(value));
      }
    } else {
      for (let value = startNum; value >= endNum; value += actualStep) {
        result.push(String(value));
      }
    }
    return result;
  }
  if (start.length === 1 && end.length === 1) {
    const startCode = start.codePointAt(0);
    const endCode = end.codePointAt(0);
    if (startCode === undefined || endCode === undefined) {
      return null;
    }
    const actualStep = step ? Number(step) : startCode <= endCode ? 1 : -1;
    if (!Number.isFinite(actualStep) || actualStep === 0) {
      return null;
    }
    const result = [];
    if (actualStep > 0) {
      for (let code = startCode; code <= endCode; code += actualStep) {
        result.push(String.fromCodePoint(code));
      }
    } else {
      for (let code = startCode; code >= endCode; code += actualStep) {
        result.push(String.fromCodePoint(code));
      }
    }
    return result;
  }
  return null;
}

function unescape(value) {
  return value.replace(/\\([\\{}])/g, "$1");
}

function findMatchingBrace(source, start) {
  let depth = 0;
  for (let i = start; i < source.length; i += 1) {
    const char = source[i];
    if (char === "{" && !isEscaped(source, i)) {
      depth += 1;
    } else if (char === "}" && !isEscaped(source, i)) {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
}

function expandPattern(prefix, rest, results) {
  const braceIndex = (() => {
    for (let i = 0; i < rest.length; i += 1) {
      if (rest[i] === "{" && !isEscaped(rest, i)) {
        return i;
      }
    }
    return -1;
  })();
  if (braceIndex === -1) {
    results.add(unescape(prefix + rest));
    return;
  }
  const before = rest.slice(0, braceIndex);
  const startIndex = braceIndex;
  const endIndex = findMatchingBrace(rest, startIndex);
  if (endIndex === -1) {
    results.add(unescape(prefix + rest));
    return;
  }
  const after = rest.slice(endIndex + 1);
  const inside = rest.slice(startIndex + 1, endIndex);
  const rangeResult = expandRange(inside);
  if (rangeResult) {
    for (const option of rangeResult) {
      expandPattern(prefix + before + option, after, results);
    }
    return;
  }
  const options = splitComma(inside);
  if (options.length === 0) {
    expandPattern(prefix + before, after, results);
    return;
  }
  for (const option of options) {
    expandPattern(prefix + before + option, after, results);
  }
}

function expand(pattern) {
  const results = new Set();
  expandPattern("", pattern, results);
  return Array.from(results);
}

function parse(pattern) {
  return expand(pattern);
}

function braceExpansion(pattern) {
  return expand(pattern);
}

braceExpansion.expand = expand;
braceExpansion.parse = parse;
braceExpansion.compile = expand;

module.exports = braceExpansion;
