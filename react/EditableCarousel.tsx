import React from 'react'
import { SliderLayout } from 'vtex.slider-layout'

type CarouselItem = {
  image: string
  imageAlt?: string
  title?: string
  text?: string
  link?: string
  __editorItemTitle?: string
}

type Props = {
  items?: CarouselItem[]
  showArrows?: boolean
  showDots?: boolean
  itemsPerPageDesktop?: number
  itemsPerPageTablet?: number
  itemsPerPageMobile?: number
}

const EditableCarousel = ({
  items = [],
  showArrows = true,
  showDots = true,
  itemsPerPageDesktop = 3,
  itemsPerPageTablet = 2,
  itemsPerPageMobile = 1,
}: Props) => {
  if (!items.length) {
    return null
  }

  return (
    <section className="mv7">
      <SliderLayout
        itemsPerPage={{
          desktop: itemsPerPageDesktop,
          tablet: itemsPerPageTablet,
          phone: itemsPerPageMobile,
        }}
        showNavigationArrows={showArrows ? 'always' : 'never'}
        showPaginationDots={showDots ? 'always' : 'never'}
        infinite={false}
        fullWidth={false}
      >
        {items.map((item, index) => {
          const content = (
            <article
              key={index}
              className="pa3"
              style={{
                height: '100%',
              }}
            >
              <div
                className="h-100"
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#fff',
                }}
              >
                <img
                  src={item.image}
                  alt={item.imageAlt || item.title || `Slide ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '220px',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />

                <div className="pa4">
                  {item.title ? <h3 className="mt0 mb2">{item.title}</h3> : null}
                  {item.text ? <p className="ma0 c-muted-1">{item.text}</p> : null}
                </div>
              </div>
            </article>
          )

          if (item.link) {
            return (
              <a
                key={index}
                href={item.link}
                style={{
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              >
                {content}
              </a>
            )
          }

          return content
        })}
      </SliderLayout>
    </section>
  )
}

;(EditableCarousel as any).schema = {
  title: 'Editable Carousel',
  type: 'object',
  properties: {
    showArrows: {
      title: 'Mostrar setas',
      type: 'boolean',
      default: true,
    },
    showDots: {
      title: 'Mostrar dots',
      type: 'boolean',
      default: true,
    },
    itemsPerPageDesktop: {
      title: 'Itens por página no desktop',
      type: 'number',
      default: 3,
    },
    itemsPerPageTablet: {
      title: 'Itens por página no tablet',
      type: 'number',
      default: 2,
    },
    itemsPerPageMobile: {
      title: 'Itens por página no mobile',
      type: 'number',
      default: 1,
    },
    items: {
      title: 'Slides',
      type: 'array',
      items: {
        type: 'object',
        properties: {
          __editorItemTitle: {
            title: 'Nome interno do item',
            type: 'string',
            default: 'Slide',
          },
          image: {
            title: 'Imagem',
            type: 'string',
            widget: {
              'ui:widget': 'image-uploader',
            },
          },
          imageAlt: {
            title: 'Alt da imagem',
            type: 'string',
          },
          title: {
            title: 'Título',
            type: 'string',
          },
          text: {
            title: 'Texto',
            type: 'string',
          },
          link: {
            title: 'Link',
            type: 'string',
          },
        },
      },
      default: [
        {
          __editorItemTitle: 'Slide 1',
          image: 'https://placehold.co/600x400',
          imageAlt: 'Atendimento rápido',
          title: 'Atendimento rápido',
          text: 'Nossa equipe recebe e analisa sua solicitação com agilidade.',
          link: '/institucional/garantia',
        },
        {
          __editorItemTitle: 'Slide 2',
          image: 'https://placehold.co/600x400',
          imageAlt: 'Envio de evidências',
          title: 'Envio de evidências',
          text: 'Anexe uma foto do produto para agilizar o suporte.',
          link: '/institucional/garantia',
        },
        {
          __editorItemTitle: 'Slide 3',
          image: 'https://placehold.co/600x400',
          imageAlt: 'Suporte especializado',
          title: 'Suporte especializado',
          text: 'Seu relato fica centralizado para acompanhamento interno.',
          link: '/institucional/garantia',
        },
      ],
    },
  },
}

export default EditableCarousel