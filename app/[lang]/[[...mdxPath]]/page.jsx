import { generateStaticParamsFor, importPage } from "nextra/pages";
import { useMDXComponents as getMDXComponents } from "../../../mdx-components";
import { NoTranslation } from "../../../components/NoTranslation";

export const generateStaticParams = generateStaticParamsFor("mdxPath");

export async function generateMetadata(props) {
  const params = await props.params;
  const { lang, mdxPath } = params;
  try {
    const { metadata } = await importPage(mdxPath, lang);
    return metadata;
  } catch {
    return {};
  }
}

const Wrapper = getMDXComponents().wrapper;

export default async function Page(props) {
  const params = await props.params;
  const { lang, mdxPath } = params;

  let MDXContent, toc, metadata, sourceCode;
  let hasTranslation = true;

  // Thử load trang với locale hiện tại
  try {
    const result = await importPage(mdxPath, lang);
    MDXContent = result.default;
    toc = result.toc;
    metadata = result.metadata;
    sourceCode = result.sourceCode;
  } catch {
    hasTranslation = false;
  }

  // Nếu không có bản dịch (chỉ áp dụng cho vi), fallback về English để render layout
  if (!hasTranslation) {
    if (lang !== "en") {
      // Load English content để render trong layout, kèm thông báo
      try {
        const result = await importPage(mdxPath, "en");
        MDXContent = result.default;
        toc = result.toc;
        metadata = result.metadata;
        sourceCode = result.sourceCode;
      } catch {
        return <div style={{ padding: "2rem" }}>Page not found.</div>;
      }

      return (
        <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
          <NoTranslation
            enPath={mdxPath ? `/en/${mdxPath.join("/")}` : "/en"}
          />
        </Wrapper>
      );
    }

    return <div style={{ padding: "2rem" }}>Page not found.</div>;
  }

  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  );
}
