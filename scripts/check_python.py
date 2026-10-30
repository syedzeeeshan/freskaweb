import sys
import pkgutil

print("Python version:", sys.version)
installed = [p.name for p in pkgutil.iter_modules()]
pdf_pkgs = [p for p in installed if any(k in p.lower() for k in ['pdf', 'fitz', 'pil', 'cv2', 'image', 'cairo'])]
print("Relevant packages:", pdf_pkgs)
