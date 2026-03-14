import type { ClientsConfig, ServiceContext } from '@vtex/api'
import { method, Service } from '@vtex/api'

import { Clients } from './clients'
import { productReport } from './middlewares/productReport'

const clients: ClientsConfig<Clients> = {
  implementation: Clients,
  options: {
    default: {
      retries: 2,
      timeout: 10000,
    },
  },
}

declare global {
  type Context = ServiceContext
}

export default new Service({
  clients,
  routes: {
    productReport: method({
      POST: [productReport],
    }),
  },
})
