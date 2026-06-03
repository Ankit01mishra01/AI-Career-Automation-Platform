"use client";

import { useState, useEffect } from "react";
import MDEditor from "@uiw/react-md-editor";
import { Download, Edit, Loader2, Monitor, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateCoverLetter } from "@/actions/cover-letter";
import useFetch from "@/hooks/use-fetch";
import "../../resume/_components/pdf-styles.css";

const CoverLetterPreview = ({ coverLetter }) => {
  const [content, setContent] = useState(coverLetter?.content || "");
  const [activeTab, setActiveTab] = useState("preview");
  const [editorMode, setEditorMode] = useState("preview");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const {
    loading: isSaving,
    fn: saveCoverLetterFn,
    data: saveResult,
    error: saveError,
  } = useFetch(updateCoverLetter);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (saveResult && !isSaving) {
      toast.success("Cover letter saved successfully!");
    }
    if (saveError) {
      toast.error(saveError.message || "Failed to save cover letter");
    }
  }, [saveResult, saveError, isSaving]);

  const handleSave = async () => {
    if (!coverLetter?.id) return;

    try {
      await saveCoverLetterFn(coverLetter.id, {
        content,
        jobDescription: coverLetter.jobDescription,
        companyName: coverLetter.companyName,
        jobTitle: coverLetter.jobTitle,
      });
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const generatePDF = async () => {
    if (typeof window === "undefined") {
      toast.error("PDF generation is only available in the browser");
      return;
    }

    if (!content?.trim()) {
      toast.error("Please add content before generating PDF");
      return;
    }

    setIsGenerating(true);
    try {
      const html2pdf = (await import("html2pdf.js/dist/html2pdf.min.js")).default;
      const element = document.getElementById("cover-letter-pdf");

      if (!element) {
        throw new Error("Cover letter content not found");
      }

      const originalDisplay = element.style.display;
      element.style.display = "block";
      element.style.visibility = "hidden";
      element.style.position = "absolute";
      element.style.left = "-9999px";

      await new Promise((resolve) => setTimeout(resolve, 100));

      const cleanElement = element.cloneNode(true);
      const removeProblematicStyles = (el) => {
        if (el.classList) {
          el.classList.remove("gradient-title", "gradient");
        }
        Array.from(el.children).forEach(removeProblematicStyles);
      };
      removeProblematicStyles(cleanElement);

      element.style.display = originalDisplay;
      element.style.visibility = "visible";
      element.style.position = "static";
      element.style.left = "auto";

      cleanElement.style.position = "absolute";
      cleanElement.style.left = "-9999px";
      cleanElement.style.visibility = "hidden";
      cleanElement.id = "cover-letter-pdf-clean";
      document.body.appendChild(cleanElement);

      const filename = `cover-letter-${coverLetter.companyName}-${coverLetter.jobTitle}`
        .replace(/[^a-z0-9-]/gi, "-")
        .toLowerCase();

      await html2pdf()
        .set({
          margin: [15, 15],
          filename: `${filename}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            logging: false,
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(cleanElement)
        .save();

      document.body.removeChild(cleanElement);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error(`Failed to generate PDF: ${error.message}`);

      const tempElement = document.getElementById("cover-letter-pdf-clean");
      if (tempElement) {
        document.body.removeChild(tempElement);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div data-color-mode="light" className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="text-sm text-muted-foreground space-y-1">
          <p>
            <span className="font-medium">Company:</span> {coverLetter.companyName}
          </p>
          <p>
            <span className="font-medium">Role:</span> {coverLetter.jobTitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="destructive" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
          <Button onClick={generatePDF} disabled={isGenerating || !isClient}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="edit">Edit</TabsTrigger>
        </TabsList>

        <TabsContent value="preview">
          <div className="border rounded-lg">
            <MDEditor value={content} preview="preview" height={700} />
          </div>
        </TabsContent>

        <TabsContent value="edit">
          <Button
            variant="link"
            type="button"
            className="mb-2"
            onClick={() =>
              setEditorMode(editorMode === "preview" ? "edit" : "preview")
            }
          >
            {editorMode === "preview" ? (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Edit Markdown
              </>
            ) : (
              <>
                <Monitor className="h-4 w-4 mr-2" />
                Show Preview
              </>
            )}
          </Button>
          <div className="border rounded-lg">
            <MDEditor
              value={content}
              onChange={setContent}
              height={700}
              preview={editorMode}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Hidden element for ATS-friendly PDF export — plain text structure, no decorative styling */}
      <div
        id="cover-letter-pdf"
        className="hidden"
        style={{
          background: "white",
          color: "black",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          padding: "20px",
          lineHeight: "1.6",
          fontSize: "14px",
          minHeight: "800px",
        }}
      >
        <MDEditor.Markdown
          source={content}
          style={{ background: "white", color: "black" }}
        />
      </div>
    </div>
  );
};

export default CoverLetterPreview;
