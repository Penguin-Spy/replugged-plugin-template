import { flux as Flux, fluxDispatcher as FluxDispatcher } from "replugged/common";

export default async (bar) => {
  return bar * bar
}

export function test() {
  console.log(Flux, FluxDispatcher)
}
