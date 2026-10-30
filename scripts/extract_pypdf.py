import os
import PyPDF2

pdf_path = r"C:\Users\sazee\.gemini\antigravity-ide\brain\52f5a81e-5e56-49a4-9de1-8cc6b3e09259\.user_uploaded\media_1793280625194.pdf"
reader = PyPDF2.PdfReader(pdf_path)

print(f"Total pages: {len(reader.pages)}")
page = reader.pages[0]

count = 0
for img_file_obj in page.images:
    count += 1
    out_name = f"public/assets/images/freska_official_logo_{count}.png"
    with open(out_name, "wb") as fp:
        fp.write(img_file_obj.data)
    print(f"Extracted image {count}: {img_file_obj.name} -> {out_name} ({len(img_file_obj.data)} bytes)")

if count == 0:
    print("No images found via page.images, inspecting XObjects directly...")
    if "/XObject" in page["/Resources"]:
        xObject = page["/Resources"]["/XObject"].get_object()
        for obj in xObject:
            print(f"XObject: {obj}, Subtype: {xObject[obj].get('/Subtype')}")
