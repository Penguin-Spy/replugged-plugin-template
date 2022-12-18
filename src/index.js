const { Injector, webpack, notices, commands, settings, quickCSS, themes, ignition, plugins } = replugged;

export async function start(ctx) {
  const inject = ctx.injector;

  const typingMod = await webpack.waitForModule(webpack.filters.byProps("startTyping"));
  const getChannelMod = await webpack.waitForModule(webpack.filters.byProps("getChannel"));

  if(typingMod && getChannelMod) {
    inject.instead(typingMod, "startTyping", ([channel]) => {
      const channelObj = getChannelMod.getChannel(channel);
      console.log(`Typing prevented! Channel: #${channelObj?.name ?? "unknown"} (${channel}).`);
    });
  }
}

export function stop(ctx) {
  ctx.injector.uninjectAll();
}
