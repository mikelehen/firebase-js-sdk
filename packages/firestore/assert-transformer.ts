import * as ts from 'typescript';
import * as path from 'path';

export function assertTransformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => (file: ts.SourceFile) => visitNodeAndChildren(file, program, context);
}

function visitNodeAndChildren(node: ts.SourceFile, program: ts.Program, context: ts.TransformationContext): ts.SourceFile;
function visitNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.Node;
function visitNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.Node {
  return ts.visitEachChild(visitNode(node, program), childNode => visitNodeAndChildren(childNode, program, context), context);
}

function visitNode(node: ts.Node, program: ts.Program): ts.Node {
  const typeChecker = program.getTypeChecker();
  if (ts.isCallExpression(node)) {
    const signature = typeChecker.getResolvedSignature(node);
    if (signature && signature.declaration &&
        signature.declaration.kind === ts.SyntaxKind.FunctionDeclaration) {
      const declaration = signature.declaration as ts.FunctionDeclaration;
      if(declaration && declaration.getSourceFile().fileName.indexOf(
          "packages/firestore/src/util/assert.ts") >= 0) {
        const method = declaration.name!.text;
        if (method === 'assert') {
          return ts.createEmptyStatement();
        } else if (method === 'fail') {
          if (node.parent.kind === ts.SyntaxKind.ExpressionStatement) {
            return ts.createEmptyStatement();
          } else {
            return ts.updateCall(node, node.expression, [], []);
          }
        }
      }
    }
  }
  return node;
}