(function () {
  const script = document.currentScript;
  if (!script) return;

  const business = script.dataset.business || script.dataset.slug;
  if (!business) {
    console.warn('Sahel.ai embed: missing data-business attribute.');
    return;
  }

  const widgetId = `sahel-ai-widget-${business}`;
  if (document.getElementById(widgetId)) return;

  const origin = new URL(script.src).origin;
  const position = script.dataset.position || 'right';
  const primaryColor = script.dataset.color || '#207a4c';
  const label = script.dataset.label || 'Chat';
  const title = script.dataset.title || 'Sahel.ai assistant';
  const isLeft = position === 'left';

  const root = document.createElement('div');
  root.id = widgetId;
  root.setAttribute('data-sahel-ai-widget', business);

  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', title);
  button.textContent = label;

  const frame = document.createElement('iframe');
  frame.title = title;
  frame.src = `${origin}/chat/${encodeURIComponent(business)}`;
  frame.loading = 'lazy';
  frame.hidden = true;

  const styles = document.createElement('style');
  styles.textContent = `
    #${widgetId} {
      position: fixed;
      ${isLeft ? 'left' : 'right'}: 20px;
      bottom: 20px;
      z-index: 2147483647;
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    #${widgetId} button {
      min-width: 112px;
      height: 46px;
      border: 0;
      border-radius: 999px;
      padding: 0 18px;
      background: ${primaryColor};
      color: #ffffff;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
      cursor: pointer;
      font: 700 15px/1 Inter, system-ui, sans-serif;
    }

    #${widgetId} iframe {
      position: absolute;
      ${isLeft ? 'left' : 'right'}: 0;
      bottom: 58px;
      width: min(380px, calc(100vw - 32px));
      height: min(620px, calc(100vh - 96px));
      border: 1px solid #dfe7df;
      border-radius: 8px;
      background: #ffffff;
      box-shadow: 0 18px 54px rgba(0, 0, 0, 0.22);
    }

    @media (max-width: 520px) {
      #${widgetId} {
        left: 12px;
        right: 12px;
        bottom: 12px;
      }

      #${widgetId} button {
        width: 100%;
      }

      #${widgetId} iframe {
        left: 0;
        right: 0;
        bottom: 58px;
        width: 100%;
        height: calc(100vh - 92px);
      }
    }
  `;

  button.addEventListener('click', function () {
    const isOpen = frame.hidden;
    frame.hidden = !isOpen;
    button.setAttribute('aria-expanded', String(isOpen));
    button.textContent = isOpen ? 'Close' : label;
  });

  root.appendChild(styles);
  root.appendChild(frame);
  root.appendChild(button);
  document.body.appendChild(root);
}());
