import PyPDF2

pdf_path = r"C:\Users\sazee\.gemini\antigravity-ide\brain\52f5a81e-5e56-49a4-9de1-8cc6b3e09259\.user_uploaded\media_1793280625194.pdf"
reader = PyPDF2.PdfReader(pdf_path)
page = reader.pages[0]

xObject = page["/Resources"]["/XObject"].get_object()
for obj in xObject:
    stream = xObject[obj]
    print(f"XObject: {obj}")
    print(f"  Subtype: {stream.get('/Subtype')}")
    print(f"  Filter: {stream.get('/Filter')}")
    print(f"  Width: {stream.get('/Width')}")
    print(f"  Height: {stream.get('/Height')}")
    print(f"  ColorSpace: {stream.get('/ColorSpace')}")
    print(f"  BitsPerComponent: {stream.get('/BitsPerComponent')}")
    data = stream.get_data()
    print(f"  Raw data length: {len(data)}")
    with open("public/assets/images/raw_logo_data.bin", "wb") as f:
        f.write(data)
    print("Saved to public/assets/images/raw_logo_data.bin")
