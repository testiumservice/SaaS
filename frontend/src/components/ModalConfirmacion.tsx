'use client';

interface Props {
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  textoCancelar: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function ModalConfirmacion({
  titulo,
  mensaje,
  textoConfirmar,
  textoCancelar,
  onConfirmar,
  onCancelar,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold">{titulo}</h2>
        <p className="mt-2 text-sm text-gray-600">{mensaje}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancelar}
            className="rounded border px-4 py-2 text-sm"
          >
            {textoCancelar}
          </button>
          <button
            onClick={onConfirmar}
            className="rounded bg-black px-4 py-2 text-sm text-white"
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}