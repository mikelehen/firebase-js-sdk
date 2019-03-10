import * as ts from 'typescript';
export function assertTransformer(program) {
    return function (context) { return function (file) { return visitNodeAndChildren(file, program, context); }; };
}
function visitNodeAndChildren(node, program, context) {
    return ts.visitEachChild(visitNode(node, program), function (childNode) { return visitNodeAndChildren(childNode, program, context); }, context);
}
function visitNode(node, program) {
    var typeChecker = program.getTypeChecker();
    if (ts.isCallExpression(node)) {
        var signature = typeChecker.getResolvedSignature(node);
        if (signature && signature.declaration &&
            signature.declaration.kind === ts.SyntaxKind.FunctionDeclaration) {
            var declaration = signature.declaration;
            if (declaration && declaration.getSourceFile().fileName.indexOf("packages/firestore/src/util/assert.ts") >= 0) {
                var method = declaration.name.text;
                if (method === 'assert') {
                    return ts.createEmptyStatement();
                }
                else if (method === 'fail') {
                    if (node.parent.kind === ts.SyntaxKind.ExpressionStatement) {
                        return ts.createEmptyStatement();
                    }
                    else {
                        return ts.updateCall(node, node.expression, [], []);
                    }
                }
            }
        }
    }
    return node;
}
