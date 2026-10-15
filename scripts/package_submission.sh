#!/bin/bash
# ==============================================================================
# Script đóng gói hồ sơ nộp bài HW02 - Domain Testing
# Tác giả: Thành viên 5 (MSSV: 23120005)
# Chuẩn đầu ra: <StudentID>_HW02_AI_DomainTesting_<Grade>.zip
# ==============================================================================

set -e

STUDENT_ID=${1:-"23120005"}
GRADE=${2:-"100"}
ZIP_NAME="${STUDENT_ID}_HW02_AI_DomainTesting_${GRADE}.zip"

echo "================================================================="
echo "ĐÓNG GÓI HỒ SƠ NỘP BÀI HW02: $ZIP_NAME"
echo "================================================================="

# 1. Trích xuất git commit log mới nhất
echo "[1/5] Trích xuất nhật ký Git Commit (git_commit_log.txt)..."
git log --pretty=format:"[%h] %ad - %s" --date=short > git_commit_log.txt

# 2. Biên dịch các tệp Markdown bắt buộc sang PDF nếu có pandoc & xelatex
echo "[2/5] Kiểm tra và biên dịch tài liệu sang định dạng PDF (theo Mục 14)..."
if command -v pandoc >/dev/null 2>&1 && command -v xelatex >/dev/null 2>&1; then
    echo "  - Đang xuất REPORT.pdf..."
    pandoc REPORT.md -o REPORT.pdf --pdf-engine=xelatex \
      -V geometry:margin=1in -V fontsize=10pt -V mainfont="Arial" || echo "  Warning: PDF export for REPORT.md fallback."

    echo "  - Đang xuất reports/ai_audit_report.pdf..."
    pandoc reports/ai_audit_report.md -o reports/ai_audit_report.pdf --pdf-engine=xelatex \
      -V geometry:margin=1in -V fontsize=10pt -V mainfont="Arial" || echo "  Warning: PDF export for ai_audit_report.md fallback."

    echo "  - Đang xuất reports/ai_critique.pdf..."
    pandoc reports/ai_critique.md -o reports/ai_critique.pdf --pdf-engine=xelatex \
      -V geometry:margin=1in -V fontsize=11pt -V mainfont="Arial" || echo "  Warning: PDF export for ai_critique.md fallback."

    echo "  - Đang xuất reports/bug_report.pdf..."
    pandoc reports/bug_report.md -o reports/bug_report.pdf --pdf-engine=xelatex \
      -V geometry:margin=1in -V fontsize=10pt -V mainfont="Arial" || echo "  Warning: PDF export for bug_report.md fallback."
else
    echo "  Notice: pandoc/xelatex không khả dụng, sử dụng các file PDF sẵn có."
fi

# 3. Tạo thư mục tạm để chuẩn bị các tệp nộp bài
echo "[3/5] Chuẩn bị cấu trúc tệp nộp bài..."
TMP_DIR="/tmp/submission_${STUDENT_ID}_$$"
mkdir -p "$TMP_DIR"

# Copy các tệp bắt buộc
cp -v REPORT.md "$TMP_DIR/"
[ -f REPORT.pdf ] && cp -v REPORT.pdf "$TMP_DIR/"
cp -v README.md "$TMP_DIR/"
cp -v git_commit_log.txt "$TMP_DIR/"
cp -v group_feature_assignment.md "$TMP_DIR/"

mkdir -p "$TMP_DIR/reports"
cp -v reports/*.md "$TMP_DIR/reports/"
for pdf_file in reports/*.pdf; do
    [ -f "$pdf_file" ] && cp -v "$pdf_file" "$TMP_DIR/reports/"
done

mkdir -p "$TMP_DIR/screenshots"
cp -v screenshots/*.png "$TMP_DIR/screenshots/"

mkdir -p "$TMP_DIR/tests"
cp -v tests/*.js "$TMP_DIR/tests/"

mkdir -p "$TMP_DIR/skills"
cp -r skills/domain-bva-generator "$TMP_DIR/skills/"

mkdir -p "$TMP_DIR/scripts"
cp -v scripts/*.js "$TMP_DIR/scripts/"
cp -v scripts/*.sh "$TMP_DIR/scripts/"

# 4. Tiến hành nén zip
echo "[4/5] Đang nén tệp zip: $ZIP_NAME..."
rm -f "$ZIP_NAME"
(cd "$TMP_DIR" && zip -r -q "$OLDPWD/$ZIP_NAME" .)

# Xóa thư mục tạm
rm -rf "$TMP_DIR"

# 5. Kiểm tra tính toàn vẹn của tệp zip
echo "[5/5] Kiểm tra nội dung tệp zip vừa tạo:"
ls -lh "$ZIP_NAME"
echo ""
echo "Danh sách tệp trong gói nộp:"
unzip -l "$ZIP_NAME" | head -n 35

echo ""
echo "================================================================="
echo "ĐÓNG GÓI HOÀN TẤT THÀNH CÔNG!"
echo "Tệp nộp bài: $ZIP_NAME"
echo "================================================================="
