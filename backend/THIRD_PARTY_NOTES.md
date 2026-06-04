# Third-Party Notes

Sahel.ai currently adapts code from cloned starter projects and uses open-source
libraries. Before market delivery, keep license notices for every cloned source
that remains in the product.

## Vector Store

The backend uses FAISS through LangChain for local vector search. FAISS is MIT
licensed, so it can be used in a commercial product when the license notice is
preserved. ChromaDB is also free/open-source under Apache 2.0, but switching is
not required for cost reasons.

## Reference SaaS

The `reference-saas` project in the parent workspace is AGPL-3.0 licensed. Treat
it as a reference unless the business is ready to comply with AGPL obligations.
Do not copy substantial code from it into a closed-source product without legal
review.
