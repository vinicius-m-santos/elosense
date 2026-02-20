# Códigos e mensagens de erro (Riot API)

Erros que vêm da Riot API são traduzidos no backend para mensagens objetivas e um código estável (`error.code`). O frontend deve exibir `error.message` e pode usar `error.code` para i18n ou lógica.

## Endpoints e cenários

### GET /api/player (busca por Game Name + Tag)

| Cenário | HTTP | error.code | error.message |
|--------|------|------------|----------------|
| Jogador não encontrado (404 Riot) | 404 | `player_not_found` | Jogador não encontrado. |
| Rate limit (429) | 422 | `rate_limited` | Muitas buscas no momento. Aguarde alguns minutos e tente novamente. |
| Serviço indisponível (403, 5xx) | 422 | `service_unavailable` / `riot_server_error` | Mensagem amigável conforme tipo. |
| Rede/timeout | 422 | `network_error` | Não foi possível conectar. Verifique sua internet e tente novamente. |
| Outro erro da API | 422 | `api_error` | Algo deu errado ao buscar os dados. Tente novamente. |

### GET /api/matches (lista de partidas)

| Cenário | HTTP | error.code | error.message |
|--------|------|------------|----------------|
| Falha ao buscar partidas (404, 5xx, etc.) | 422 | `matches_unavailable` / `riot_server_error` / etc. | Partidas temporariamente indisponíveis... ou conforme tipo. |
| Rate limit | 429 | `rate_limited` | Muitas buscas no momento. Aguarde alguns minutos e tente novamente. |

### GET /api/match/{matchId} (detalhe da partida)

| Cenário | HTTP | error.code | error.message |
|--------|------|------------|----------------|
| Partida não encontrada (404 Riot) | 404 | `match_not_found` | Partida não encontrada. |
| Outro erro (5xx, rede, etc.) | 422 | `riot_server_error` / `network_error` / `api_error` | Mensagem amigável conforme tipo. |

## Códigos estáveis (error.code)

- `player_not_found` – Conta/jogador não existe na Riot para o Riot ID informado.
- `match_not_found` – Partida não encontrada.
- `matches_unavailable` – Erro ao buscar lista de partidas (mensagem genérica).
- `service_unavailable` – 403 (ex.: API key, permissão).
- `rate_limited` – 429; usuário deve aguardar.
- `riot_server_error` – 5xx ou timeout dos servidores Riot.
- `network_error` – Falha de rede/timeout no cliente.
- `api_error` – Qualquer outro erro da Riot.

Todas as mensagens estão em PT-BR. O backend nunca expõe URLs, códigos HTTP crus nem detalhes técnicos da API ao usuário.
