import { IOClients } from '@vtex/api'
import MD from './md'

export class Clients extends IOClients {
  public get md() {
    return this.getOrSet('md', MD)
  }
}
