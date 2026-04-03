import assert from "node:assert/strict";
import {
  buildOfficialLegalSnapshot,
  extractArgentinaOfficialUrlFromSearchHtml,
  extractReadableLegalTextFromHtml,
  inferArgentinaLawNumber,
} from "@/lib/legal-source-fetch";
import { detectOfficialLegalSource, detectOfficialStatusSignals } from "@/lib/legal-source-officials";

async function runTest(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

void (async () => {
  await runTest("extractReadableLegalTextFromHtml removes tags and preserves readable body text", () => {
    const html = `
      <html>
        <body>
          <main>
            <h1>Ley 123</h1>
            <p>Articulo 1. Texto principal.</p>
            <p>Articulo 2. Segundo parrafo.</p>
          </main>
        </body>
      </html>
    `;

    const text = extractReadableLegalTextFromHtml(html);

    assert.match(text, /Ley 123/);
    assert.match(text, /Articulo 1\. Texto principal\./);
    assert.match(text, /Articulo 2\. Segundo parrafo\./);
    assert.doesNotMatch(text, /<p>/);
  });

  await runTest("detectOfficialLegalSource recognizes InfoLEG for Argentina", () => {
    const result = detectOfficialLegalSource("https://www.argentina.gob.ar/normativa/nacional/ley-27801-123456/texto", "Argentina");
    assert.equal(result.recognized, true);
    assert.equal(result.preferred, true);
  });

  await runTest("detectOfficialStatusSignals marks derogation keywords for review", () => {
    const result = detectOfficialStatusSignals("La presente ley queda derogada por la Ley 27801.");
    assert.equal(result.shouldReview, true);
  });

  await runTest("buildOfficialLegalSnapshot normalizes title and summary from InfoLEG text", () => {
    const snapshot = buildOfficialLegalSnapshot(
      "https://www.argentina.gob.ar/normativa/nacional/ley-22278-1234",
      "Ley 22278 PODER EJECUTIVO NACIONAL (P.E.N.) 25-ago-1980 MINORIDAD REGIMEN PENAL Publicada en el Boletin Oficial. Resumen: ESTABLECESE EL REGIMEN PENAL DE LA MINORIDAD. Observaciones: ABROGADA POR EL ARTICULO 48 DE LA LEY 27801. Vigencia: A LOS CIENTO OCHENTA DIAS.",
      "Argentina"
    );

    assert.equal(snapshot.normalizedTitle, "Ley 22278 - Minoridad regimen penal");
    assert.equal(snapshot.officialNumber, "22278");
    assert.equal(snapshot.officialName, "Minoridad regimen penal");
    assert.equal(snapshot.validityStatus, "Derogada");
    assert.equal(snapshot.relatedRule, "Ley 27801");
    assert.match(snapshot.normalizedContent, /Resumen oficial:/);
    assert.match(snapshot.normalizedContent, /Observaciones oficiales:/);
    assert.doesNotMatch(snapshot.normalizedContent, /PODER EJECUTIVO NACIONAL/);
  });

  await runTest("inferArgentinaLawNumber detects a law number from free text", () => {
    const lawNumber = inferArgentinaLawNumber("ley de regimen juvenil 22278", "texto libre");
    assert.equal(lawNumber, "22278");
  });

  await runTest("extractArgentinaOfficialUrlFromSearchHtml finds official argentina normativa url", () => {
    const html = `
      <a href="https://www.argentina.gob.ar/normativa/nacional/ley-27801-423722/texto">
        Ley 27801
      </a>
    `;

    const url = extractArgentinaOfficialUrlFromSearchHtml(html, "27801");
    assert.equal(url, "https://www.argentina.gob.ar/normativa/nacional/ley-27801-423722/texto");
  });
})();
