import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const extractDocument = (file, docType) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('doc_type', docType)
  return api.post('/extract', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const checkDocuments = (extractedDocs, caseForm) =>
  api.post('/check', { extracted_docs: extractedDocs, case_form: caseForm })

export const generateDraft = (caseForm, documents) =>
  api.post('/draft', { case_form: caseForm, documents })

export const exportPdf = (draftText, caseForm) =>
  api.post('/export/pdf', { draft_text: draftText, case_form: caseForm }, { responseType: 'blob' })

export const exportDocx = (draftText, caseForm) =>
  api.post('/export/docx', { draft_text: draftText, case_form: caseForm }, { responseType: 'blob' })

export const saveCase = (caseData) => api.post('/cases', caseData)
