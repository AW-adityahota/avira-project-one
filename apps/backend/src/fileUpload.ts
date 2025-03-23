import express, { Request, Response } from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import xlsx from "xlsx";
const app = express();
const router = express.Router();
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

router.post("/uploads",upload.single("file"),async(req,res):Promise<any>=>{
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: "File too large (max 5MB)" });
      }

    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const fileType = req.file.mimetype;

    try {
        let extractedText = "";

        if (fileType === "application/pdf") {
            const data = await pdfParse(fileBuffer);
            extractedText = data.text;
        } else if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            const data = await mammoth.extractRawText({ buffer: fileBuffer });
            extractedText = data.value;
        } else if (
            fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
            fileType === "application/vnd.ms-excel"
        ) {
            const workbook = xlsx.read(fileBuffer, { type: "buffer" });
            extractedText = JSON.stringify(workbook.Sheets);
        } else {
            return res.status(400).json({ error: "Unsupported file type" });
        }

        res.json({ text: extractedText });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error processing file" });
    }
})

export default router;