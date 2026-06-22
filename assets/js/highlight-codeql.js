// Minimal highlight.js language definition for CodeQL.
// Registered as 'codeql' so class="language-codeql" is picked up by hljs.highlightAll().
(function () {
  function codeql(hljs) {
    return {
      name: 'CodeQL',
      keywords: {
        keyword: 'from where select exists not and or in instanceof if then else as any none',
        built_in: 'predicate class import module extends implements this result super new'
      },
      contains: [
        hljs.C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        hljs.QUOTE_STRING_MODE,
        hljs.C_NUMBER_MODE,
        { className: 'type',  begin: /\b[A-Z][A-Za-z0-9_]*\b/ },
        { className: 'title', begin: /\b[a-z][A-Za-z0-9_]*(?=\s*\()/ }
      ]
    };
  }
  if (typeof module !== 'undefined') module.exports = codeql;
  else if (typeof hljs !== 'undefined') hljs.registerLanguage('codeql', codeql);
})();
