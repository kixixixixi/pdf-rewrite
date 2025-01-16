import { PDFDocument, rgb, PDFPage } from "pdf-lib"
import * as pdfjsLib from "pdfjs-dist"
import fs from "fs/promises"

interface TextItem {
  text: string
  x: number
  y: number
  width: number
  height: number
}

const processPage = async (
  page: PDFPage,
  textItems: TextItem[]
): Promise<void> => {
  const { height } = page.getSize()

  for (const item of textItems) {
    const translatedText = Array.from(item.text)
      .map(_ => "h")
      .join("")

    page.drawRectangle({
      x: item.x,
      y: height - item.y,
      width: item.width,
      height: item.height,
      color: rgb(1, 1, 1),
    })

    page.drawText(translatedText, {
      x: item.x,
      y: height - item.y,
      size: 12,
      color: rgb(0, 0, 0),
    })
  }
}

const processPDF = async (inputPdfBytes: Uint8Array): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.load(inputPdfBytes)

  const { pageTexts } = await extractTextFromPDF(inputPdfBytes)

  const pages = pdfDoc.getPages()
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    const textItems = pageTexts[i]
    await processPage(page, textItems)
  }

  return await pdfDoc.save()
}

const extractTextFromPDF = async (
  pdfBytes: Uint8Array
): Promise<{ pageTexts: TextItem[][] }> => {
  const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise

  const pageTexts: TextItem[][] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()

    console.log(textContent)

    const items: TextItem[] = textContent.items.map((item: any) => {
      const transform = item.transform
      return {
        text: item.str,
        x: transform[4],
        y: transform[5],
        width: item.width,
        height: item.height,
      }
    })

    pageTexts.push(items)
  }

  return { pageTexts }
}
;(async () => {
  try {
    const inputPdfBytes = await fs.readFile("files/input.pdf")

    const outputPdfBytes = await processPDF(new Uint8Array(inputPdfBytes))

    await fs.writeFile("files/output.pdf", outputPdfBytes)
  } catch (error) {
    console.error("Error processing PDF:", error)
  }
})()
