// ========================================
// Custom AST ESLint Rule: Enforce Tenant ID
// Traceability: CIP-WP-008 | Rule SMB-221
// ========================================

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce tenantId parameter in Drizzle select, insert, update, and delete query calls',
      category: 'Possible Errors',
      recommended: true,
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== 'MemberExpression') return;

        const obj = callee.object;
        const prop = callee.property;

        // Check if the query is executed on the 'db' or 'tx' Drizzle instances
        const isDbOrTx = obj.type === 'Identifier' && (obj.name === 'db' || obj.name === 'tx');
        if (!isDbOrTx) return;

        // Check if the database query keyword matches
        const methodName = prop.name;
        if (!['select', 'insert', 'update', 'delete'].includes(methodName)) return;

        // Traverse up the syntax parent chain to check for where() or values() arguments containing tenantId
        let current = node.parent;
        let hasTenantId = false;

        while (current) {
          // Stop checking if we exit the active query statement scope
          if (
            current.type === 'ExpressionStatement' ||
            current.type === 'VariableDeclarator' ||
            current.type === 'ReturnStatement'
          ) {
            break;
          }

          if (current.type === 'CallExpression') {
            const chainCallee = current.callee;
            if (chainCallee.type === 'MemberExpression') {
              const chainMethod = chainCallee.property.name;

              // Inspect arguments of .where() or .values()
              if (chainMethod === 'where' || chainMethod === 'values') {
                const args = current.arguments;
                if (args && args.length > 0) {
                  // Retrieve raw text representation of AST node
                  const sourceCode = (context.sourceCode || context.getSourceCode()).getText(args[0]);
                  if (sourceCode.includes('tenantId')) {
                    hasTenantId = true;
                  }
                }
              }
            }
          }
          current = current.parent;
        }

        if (!hasTenantId) {
          context.report({
            node,
            message: `Drizzle query '.${methodName}()' is missing a mandatory 'tenantId' check or value.`,
          });
        }
      }
    };
  }
};

export default rule;
