import React from 'react'

type Props = {
  imageDesktop?: string
  alt?: string
}

const BannerHero = ({
  imageDesktop = 'https://placehold.co/1440x420',
  alt = 'Banner',
}: Props) => {
  return (
    <div className="mv6">
      <img
        src={imageDesktop}
        alt={alt}
        style={{ width: '100%', display: 'block', borderRadius: '8px' }}
      />
    </div>
  )
}

;(BannerHero as any).schema = {
  title: 'Banner Hero',
  type: 'object',
  properties: {
    imageDesktop: {
      title: 'Imagem do banner',
      type: 'string',
      default: 'https://placehold.co/1440x420',
      widget: {
        'ui:widget': 'image-uploader',
      },
    },
    alt: {
      title: 'Texto alternativo (alt)',
      type: 'string',
      default: 'Banner',
    },
  },
}

export default BannerHero