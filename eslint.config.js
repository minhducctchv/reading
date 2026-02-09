// eslint.config.js
import antfu from "@antfu/eslint-config";

export default antfu({
  formatters: {
    // Tắt formatter cho mdx (hoặc set thành false)
    markdown: false,
    css: true,
    html: true,
  },
  // Hoặc nếu muốn tắt hẳn kiểm tra file mdx
  ignores: ["**/*.mdx"],
});
