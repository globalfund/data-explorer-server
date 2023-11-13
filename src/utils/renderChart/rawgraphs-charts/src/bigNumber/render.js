export function render(node, data) {
  node.innerHTML = `
    <div style="min-width: 135px;">
      <div style="font-size: 9px;text-transform: uppercase;border-bottom: 1px solid #000;padding-bottom: 2px;line-height: 11px;">
        ${data.title}
      </div>
      <div style="font-size: 45px;font-weight: 600;line-height: 54px;margin: 11px 0;">
        ${data.value}
      </div>
      <div style="font-size: 9px;text-transform: uppercase;border-bottom: 1px solid #000;padding-bottom: 2px;line-height: 11px;">
        ${data.subtitle}
      </div>
      <div style="font-size: 8px;line-height: 9px;margin-top: 8px;">
        ${data.description}
      </div>
    </div>
  `
}
