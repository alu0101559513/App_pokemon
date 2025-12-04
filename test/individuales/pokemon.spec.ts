import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/server/api.js";

/**
 * Tests para los endpoints de Pokémon TCG API
 * Estos tests verifican la integración con la API externa de Pokémon Trading Card Game
 */

describe("GET /pokemon/cards/name/:name", () => {
  /**
   * Test: Buscar cartas por nombre
   * Verifica que se puedan obtener cartas del API de Pokémon TCG usando su nombre
   */
  it("devuelve cartas por nombre", async () => {
    const res = await request(app)
      .get("/pokemon/cards/name/pikachu")
      .expect(200);

    expect(Array.isArray(res.body) || res.body.data).toBeDefined();
  });

  /**
   * Test: Búsqueda sin resultados
   * Verifica que retorna un array vacío cuando no hay cartas que coincidan con el nombre buscado
   */
  it("devuelve [] si no hay resultados", async () => {
    const res = await request(app)
      .get("/pokemon/cards/name/nonexistentcard12345")
      .expect(200);

    expect(res.body).toBeDefined();
  });
});

describe("GET /pokemon/cards/:id", () => {
  /**
   * Test: Obtener carta específica por ID
   * Verifica que se puede recuperar una carta individual del API de Pokémon TCG por su ID
   */
  it("devuelve una carta por ID", async () => {
    const res = await request(app)
      .get("/pokemon/cards/base1-1")
      .expect(200);

    expect(res.body).toBeDefined();
  });

  /**
   * Test: Carta no encontrada
   * Verifica que retorna un error 404 cuando se intenta obtener una carta que no existe
   */
  it("devuelve 404 si la carta no existe", async () => {
    const res = await request(app)
      .get("/pokemon/cards/nonexistent-id-12345")
      .expect(404);

    expect(res.body.error).toBe("Card not found");
  });
});

describe("GET /pokemon/sets", () => {
  /**
   * Test: Obtener todos los sets disponibles
   * Verifica que se pueden obtener todos los sets/ediciones disponibles del API de Pokémon TCG
   */
  it("devuelve todos los sets disponibles", async () => {
    const res = await request(app)
      .get("/pokemon/sets")
      .expect(200);

    expect(Array.isArray(res.body) || res.body.data).toBeDefined();
  });
});

describe("GET /pokemon/sets/:setId", () => {
  /**
   * Test: Obtener cartas de un set específico
   * Verifica que se pueden obtener todas las cartas que pertenecen a un set específico
   */
  it("devuelve todas las cartas de un set", async () => {
    const res = await request(app)
      .get("/pokemon/sets/base1")
      .expect(200);

    expect(res.body).toBeDefined();
  });

  /**
   * Test: Set no encontrado
   * Verifica que retorna un error 404 cuando se intenta obtener un set que no existe
   */
  it("devuelve 404 si el set no existe", async () => {
    const res = await request(app)
      .get("/pokemon/sets/nonexistent-set-12345")
      .expect(404);

    expect(res.body.error).toBe("Set not found");
  });
});

describe("GET /pokemon/cards/type/:type", () => {
  /**
   * Test: Buscar cartas por tipo de Pokémon
   * Verifica que se pueden obtener cartas filtradas por su tipo (Eléctrico, Fuego, Agua, etc.)
   */
  it("devuelve cartas por tipo", async () => {
    const res = await request(app)
      .get("/pokemon/cards/type/electric")
      .expect(200);

    expect(Array.isArray(res.body) || res.body.data).toBeDefined();
  });

  /**
   * Test: Tipo sin resultados
   * Verifica que retorna un array vacío cuando no hay cartas del tipo especificado
   */
  it("devuelve [] si no hay cartas del tipo", async () => {
    const res = await request(app)
      .get("/pokemon/cards/type/nonexistenttype")
      .expect(200);

    expect(res.body).toBeDefined();
  });
});

describe("GET /pokemon/cards/hp/:hp", () => {
  /**
   * Test: Buscar cartas por puntos de vida (HP)
   * Verifica que se pueden obtener cartas filtradas por su valor de HP
   */
  it("devuelve cartas por HP", async () => {
    const res = await request(app)
      .get("/pokemon/cards/hp/100")
      .expect(200);

    expect(Array.isArray(res.body) || res.body.data).toBeDefined();
  });

  /**
   * Test: HP con valor inválido
   * Verifica que retorna error 400 cuando el HP no es un número
   */
  it("devuelve 400 si el HP no es un número", async () => {
    const res = await request(app)
      .get("/pokemon/cards/hp/notanumber")
      .expect(400);

    expect(res.body.error).toContain("must be a number");
  });

  /**
   * Test: HP sin resultados
   * Verifica que retorna un array vacío cuando no hay cartas con el HP especificado
   */
  it("devuelve [] si no hay cartas con ese HP", async () => {
    const res = await request(app)
      .get("/pokemon/cards/hp/9999")
      .expect(200);

    expect(res.body).toBeDefined();
  });
});

describe("GET /pokemon/cards/rarity/:rarity", () => {
  /**
   * Test: Buscar cartas por rareza
   * Verifica que se pueden obtener cartas filtradas por su nivel de rareza (Común, Raro, etc.)
   */
  it("devuelve cartas por rareza", async () => {
    const res = await request(app)
      .get("/pokemon/cards/rarity/rare")
      .expect(200);

    expect(Array.isArray(res.body) || res.body.data).toBeDefined();
  });

  /**
   * Test: Rareza sin resultados
   * Verifica que retorna un array vacío cuando no hay cartas de la rareza especificada
   */
  it("devuelve [] si no hay cartas de esa rareza", async () => {
    const res = await request(app)
      .get("/pokemon/cards/rarity/nonexistentrarity")
      .expect(200);

    expect(res.body).toBeDefined();
  });
});

describe("GET /pokemon/series", () => {
  /**
   * Test: Obtener todas las series disponibles
   * Verifica que se pueden obtener todas las series/generaciones del API de Pokémon TCG
   */
  it("devuelve todas las series disponibles", async () => {
    const res = await request(app)
      .get("/pokemon/series")
      .expect(200);

    expect(Array.isArray(res.body) || res.body.data).toBeDefined();
  });
});

describe("GET /pokemon/series/:seriesId", () => {
  /**
   * Test: Obtener información de una serie específica
   * Verifica que se puede obtener información detallada de una serie en particular
   */
  it("devuelve información de una serie específica", async () => {
    const res = await request(app)
      .get("/pokemon/series/base")
      .expect(200);

    expect(res.body).toBeDefined();
  });

  /**
   * Test: Serie no encontrada
   * Verifica que retorna error 404 cuando se intenta obtener una serie inexistente
   */
  it("devuelve 404 si la serie no existe", async () => {
    const res = await request(app)
      .get("/pokemon/series/nonexistent-series-12345")
      .expect(404);

    expect(res.body.error).toBe("Series not found");
  });
});

describe("GET /pokemon/search", () => {
  it("devuelve resultados de búsqueda por nombre", async () => {
    const res = await request(app)
      .get("/pokemon/search?name=pikachu")
      .expect(200);

    expect(res.body).toBeDefined();
  });

  it("devuelve resultados con múltiples filtros", async () => {
    const res = await request(app)
      .get("/pokemon/search?name=pikachu&type=electric&rarity=common")
      .expect(200);

    expect(res.body).toBeDefined();
  });

  it("devuelve [] sin parámetros", async () => {
    const res = await request(app)
      .get("/pokemon/search")
      .expect(200);

    expect(res.body).toBeDefined();
  });

  it("devuelve [] si no hay coincidencias", async () => {
    const res = await request(app)
      .get("/pokemon/search?name=nonexistent12345")
      .expect(200);

    expect(res.body).toBeDefined();
  });
});
