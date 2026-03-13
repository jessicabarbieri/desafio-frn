import React, { ChangeEvent, FormEvent, useMemo, useState } from 'react'
import styles from './ContactProductForm.css'

type Props = {
  maxFileSizeMB?: number
  acceptedFileTypes?: string[]
  blockClass?: string
  dataEntityAcronym?: string
}

type FormDataShape = {
  clientName: string
  email: string
  phone: string
  orderId: string
  skuId: string
  productName: string
  message: string
}

const initialState: FormDataShape = {
  clientName: '',
  email: '',
  phone: '',
  orderId: '',
  skuId: '',
  productName: '',
  message: '',
}

const MD_DOCUMENTS_PATH = (acronym: string) =>
  `/api/dataentities/${acronym}/documents`

const ContactProductForm = ({
  maxFileSizeMB = 5,
  acceptedFileTypes = ['image/jpeg', 'image/png'],
  blockClass = '',
  dataEntityAcronym = 'PR',
}: Props) => {
  const [form, setForm] = useState<FormDataShape>(initialState)
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [documentId, setDocumentId] = useState<string | null>(null)

  const maxBytes = useMemo(() => maxFileSizeMB * 1024 * 1024, [maxFileSizeMB])

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value)

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 10) {
      return digits.replace(/^(\d{0,2})(\d{0,4})(\d{0,4}).*$/, (_, a, b, c) => {
        let result = ''
        if (a) result += `(${a}`
        if (a.length === 2) result += ') '
        if (b) result += b
        if (c) result += `-${c}`
        return result
      })
    }
    return digits.replace(/^(\d{2})(\d{5})(\d{4}).*$/, '($1) $2-$3')
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!form.clientName.trim()) nextErrors.clientName = 'Informe seu nome'
    if (!form.email.trim()) nextErrors.email = 'Informe seu e-mail'
    else if (!isValidEmail(form.email)) nextErrors.email = 'Informe um e-mail válido'
    if (!form.message.trim()) nextErrors.message = 'Escreva sua mensagem'
    if (!file) {
      nextErrors.file = 'Anexe 1 foto do produto'
    } else {
      if (!acceptedFileTypes.includes(file.type)) nextErrors.file = 'Envie apenas JPG ou PNG'
      if (file.size > maxBytes) nextErrors.file = `O arquivo deve ter no máximo ${maxFileSizeMB}MB`
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleInputChange =
    (field: keyof FormDataShape) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const inputValue = (event.currentTarget as unknown as { value: string }).value
      const value = field === 'phone' ? formatPhone(inputValue) : inputValue
      setForm((prev) => ({ ...prev, [field]: value }))
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }

  const handleTextareaChange =
    (field: keyof FormDataShape) =>
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const inputValue = (event.currentTarget as unknown as { value: string }).value
      setForm((prev) => ({ ...prev, [field]: inputValue }))
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const target = event.currentTarget as unknown as { files?: { length: number; [i: number]: File } | null }
    const selectedFile = target.files?.[0] ?? null
    setFile(selectedFile)
    setErrors((prev) => ({ ...prev, file: '' }))
  }

  const fileToBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const g = typeof globalThis !== 'undefined' ? globalThis : ({} as Record<string, unknown>)
      const FileReaderApi = (g as Record<string, unknown>).FileReader
      if (!FileReaderApi) return reject(new Error('FileReader not available'))
      const Reader = FileReaderApi as new () => {
        readAsDataURL(blob: Blob): void
        result: string | ArrayBuffer | null
        onload: () => void
        onerror: () => void
      }
      const reader = new Reader()
      reader.onload = () => resolve((reader.result as string) ?? '')
      reader.onerror = reject
      reader.readAsDataURL(f)
    })

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFeedbackMessage('')
    setDocumentId(null)
    setStatus('idle')

    if (!validate()) {
      setStatus('error')
      setFeedbackMessage('Revise os campos obrigatórios antes de enviar.')
      return
    }

    try {
      setStatus('loading')
      const imageBase64 = file ? await fileToBase64(file) : ''

      const payload: Record<string, string | undefined> = {
        clientName: form.clientName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        orderId: form.orderId.trim() || undefined,
        skuId: form.skuId.trim() || undefined,
        productName: form.productName.trim() || undefined,
        message: form.message.trim(),
        image: imageBase64 || undefined,
      }

      const res = await fetch(MD_DOCUMENTS_PATH(dataEntityAcronym), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin',
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || `HTTP ${res.status}`)
      }

      const data = (await res.json().catch(() => ({}))) as {
        DocumentId?: string
        Id?: string
        id?: string
      }
      const id = data.DocumentId ?? data.Id ?? data.id ?? null
      setDocumentId(id)
      setStatus('success')
      setFeedbackMessage('Solicitação enviada com sucesso.')
      setForm(initialState)
      setFile(null)
      setErrors({})
    } catch (error) {
      setStatus('error')
      setFeedbackMessage(
        error instanceof Error ? error.message : 'Não foi possível enviar sua solicitação no momento.'
      )
    }
  }

  const containerClass = blockClass
    ? `${styles.contactProductForm} ${styles.contactProductForm}--${blockClass}`
    : styles.contactProductForm

  return (
    <section className={`${containerClass} mv7`} aria-labelledby="form-title" data-contact-form="section">
      <div className={styles.contactProductForm__card} data-contact-form="card">
        <form onSubmit={handleSubmit} noValidate className={styles.contactProductForm__form} data-contact-form="form">
          <div className={styles.contactProductForm__grid} data-contact-form="grid">
            <div className={styles.contactProductForm__column} data-contact-form="column">
              <div className={styles.contactProductForm__field} data-contact-form="field">
                <label className={styles.contactProductForm__label} htmlFor="clientName" data-contact-form="label">
                  Nome *
                </label>
                <input
                  id="clientName"
                  type="text"
                  className={styles.contactProductForm__input}
                  data-contact-form="input"
                  value={form.clientName}
                  onChange={handleInputChange('clientName')}
                  placeholder="Seu nome"
                  aria-required="true"
                  aria-invalid={!!errors.clientName}
                  data-invalid={errors.clientName ? 'true' : undefined}
                  aria-describedby={errors.clientName ? 'err-clientName' : undefined}
                />
                {errors.clientName && (
                  <p id="err-clientName" className={styles.contactProductForm__error} role="alert" data-contact-form="error">
                    {errors.clientName}
                  </p>
                )}
              </div>

              <div className={styles.contactProductForm__field} data-contact-form="field">
                <label className={styles.contactProductForm__label} htmlFor="email" data-contact-form="label">
                  E-mail *
                </label>
                <input
                  id="email"
                  type="email"
                  className={styles.contactProductForm__input}
                  data-contact-form="input"
                  value={form.email}
                  onChange={handleInputChange('email')}
                  placeholder="voce@exemplo.com"
                  aria-required="true"
                  aria-invalid={!!errors.email}
                  data-invalid={errors.email ? 'true' : undefined}
                  aria-describedby={errors.email ? 'err-email' : undefined}
                />
                {errors.email && (
                  <p id="err-email" className={styles.contactProductForm__error} role="alert" data-contact-form="error">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className={styles.contactProductForm__field} data-contact-form="field">
                <label className={styles.contactProductForm__label} htmlFor="phone" data-contact-form="label">
                  Telefone
                </label>
                <input
                  id="phone"
                  type="tel"
                  className={styles.contactProductForm__input}
                  data-contact-form="input"
                  value={form.phone}
                  onChange={handleInputChange('phone')}
                  placeholder="(11) 99999-9999"
                  aria-invalid={!!errors.phone}
                  data-invalid={errors.phone ? 'true' : undefined}
                />
              </div>
            </div>

            <div className={styles.contactProductForm__column} data-contact-form="column">
              <div className={styles.contactProductForm__field} data-contact-form="field">
                <label className={styles.contactProductForm__label} htmlFor="skuId" data-contact-form="label">
                  ID do SKU
                </label>
                <input
                  id="skuId"
                  type="text"
                  className={styles.contactProductForm__input}
                  data-contact-form="input"
                  value={form.skuId}
                  onChange={handleInputChange('skuId')}
                  placeholder="ID do SKU"
                />
              </div>

              <div className={styles.contactProductForm__field} data-contact-form="field">
                <label className={styles.contactProductForm__label} htmlFor="productName" data-contact-form="label">
                  Nome do produto
                </label>
                <input
                  id="productName"
                  type="text"
                  className={styles.contactProductForm__input}
                  data-contact-form="input"
                  value={form.productName}
                  onChange={handleInputChange('productName')}
                  placeholder="Nome do produto"
                />
              </div>
              <div className={styles.contactProductForm__field} data-contact-form="field">
                <label className={styles.contactProductForm__label} htmlFor="orderId" data-contact-form="label">
                  ID do pedido
                </label>
                <input
                  id="orderId"
                  type="text"
                  className={styles.contactProductForm__input}
                  data-contact-form="input"
                  value={form.orderId}
                  onChange={handleInputChange('orderId')}
                  placeholder="ID do pedido"
                />
              </div>
              
            </div>
          </div>

          <div className={styles.contactProductForm__field} data-contact-form="field">
                <label className={styles.contactProductForm__label} htmlFor="image" data-contact-form="label">
                  Imagem *
                </label>
                <input
                  id="image"
                  type="file"
                  accept={acceptedFileTypes.join(',')}
                  onChange={handleFileChange}
                  className={styles.contactProductForm__file}
                  data-contact-form="file"
                  aria-required="true"
                  aria-invalid={!!errors.file}
                  data-invalid={errors.file ? 'true' : undefined}
                  aria-describedby={errors.file ? 'err-file' : file ? 'file-name' : undefined}
                />
                {file && (
                  <p id="file-name" className={styles.contactProductForm__fileHint} data-contact-form="fileHint">
                    Arquivo selecionado: {file.name}
                  </p>
                )}
                {errors.file && (
                  <p id="err-file" className={styles.contactProductForm__error} role="alert" data-contact-form="error">
                    {errors.file}
                  </p>
                )}
              </div>

          <div className={`${styles.contactProductForm__field} ${styles.contactProductForm__fieldFull}`} data-contact-form="fieldFull">
            <label className={styles.contactProductForm__label} htmlFor="message" data-contact-form="label">
              Mensagem *
            </label>
            <textarea
              id="message"
              className={styles.contactProductForm__textarea}
              data-contact-form="textarea"
              rows={5}
              value={form.message}
              onChange={handleTextareaChange('message')}
              placeholder="Descreva o que aconteceu com o produto"
              aria-required="true"
              aria-invalid={!!errors.message}
              data-invalid={errors.message ? 'true' : undefined}
              aria-describedby={errors.message ? 'err-message' : undefined}
            />
            {errors.message && (
              <p id="err-message" className={styles.contactProductForm__error} role="alert" data-contact-form="error">
                {errors.message}
              </p>
            )}
          </div>

          <div className={styles.contactProductForm__actions} data-contact-form="actions">
            <button
              type="submit"
              disabled={status === 'loading'}
              className={styles.contactProductForm__submit}
              data-contact-form="submit"
              aria-busy={status === 'loading'}
            >
              {status === 'loading' ? 'Enviando...' : 'Enviar solicitação'}
            </button>

            {feedbackMessage && (
              <p
                className={`${styles.contactProductForm__feedback} ${status === 'success' ? styles.contactProductForm__feedbackSuccess : ''} ${status === 'error' ? styles.contactProductForm__feedbackError : ''}`}
                role="status"
                aria-live="polite"
                data-contact-form={status === 'success' ? 'feedbackSuccess' : status === 'error' ? 'feedbackError' : 'feedback'}
              >
                {feedbackMessage}
                {documentId && (
                  <span className={styles.contactProductForm__documentId} data-contact-form="documentId"> (ID: {documentId})</span>
                )}
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  )
}

;(ContactProductForm as any).schema = {
  title: 'Contact Product Form',
  type: 'object',
  properties: {
    maxFileSizeMB: {
      title: 'Tamanho máximo do arquivo (MB)',
      type: 'number',
      default: 5,
    },
    acceptedFileTypes: {
      title: 'Tipos de arquivo aceitos',
      type: 'array',
      items: { type: 'string' },
      default: ['image/jpeg', 'image/png'],
    },
    blockClass: {
      title: 'Classe do bloco (CSS)',
      type: 'string',
    },
    dataEntityAcronym: {
      title: 'Acrônimo da entidade no Master Data V1',
      description: 'Ex.: PR, FG, FR. Confira no admin do Master Data.',
      type: 'string',
      default: 'PR',
    },
  },
}

export default ContactProductForm
