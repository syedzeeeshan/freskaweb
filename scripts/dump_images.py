
import PyPDF2

pdf_path = r"C:\Users\sazee\.gemini\antigravity-ide\brain\52f5a81e-5e56-49a4-9de1-8cc6b3e09259\.user_uploaded\media_1793280625194.pdf"
reader = PyPDF2.PdfReader(pdf_path)
page = reader.pages[0]
xObject = page["/Resources"]["/XObject"].get_object()

with open("public/assets/images/logo_1024_raw.bin", "wb") as f:
    f.write(xObject["/X4"].get_data())

with open("public/assets/images/logo_cropped_raw.bin", "wb") as f:
    f.write(xObject["/X6"].get_data())
print("Python dumped both raw RGB images.")
