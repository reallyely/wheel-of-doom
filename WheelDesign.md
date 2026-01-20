# Wheel
## Domain-First, High-Cohesion Design (Ports & Adapters Aligned)

This document refines the **Community Randomizer** design by explicitly applying the **Ports & Adapters / Hexagonal Architecture** guidance from  
https://tbuss.de/posts/2023/9-how-to-do-the-package-structure-in-a-ports-and-adapter-architecture/#internal-structure-of-a-package

The goal is to:
- Maximize **cohesion**
- Preserve **domain purity**
- Delegate infrastructure (e.g. Colyseus) without leaking rules
- Ensure the design scales cleanly as features grow

---

## 1. Architectural Goals

### Primary Goals
- Observable, physics-based randomness
- Host-controlled, community-driven participation
- Deterministic, testable core logic
- Infrastructure that can be swapped or extended
* Enable fair and transparent randomized decision-making for communities
* Encourage participation through contribution and influence 
* Provide engaging, simulation-based visuals rather than abstract randomness 
* Support multiple selection modes and extensible selection methods 
* Integrate with other applications that provide community 
    * Discord 
    * Twitch

### Architectural Principles
- **Domain First**: Business rules exist independently of UI, networking, or storage
- **Explicit Boundaries**: Ports define how the outside world interacts with the domain
- **Thin Adapters**: Framework code only translates input/output
- **State Authority**: The domain decides what is valid; infrastructure only transports state

---

## 2. High-Level Architecture

```

Clients (UI, Twitch, Discord)
↓
Inbound Adapters (Colyseus, HTTP)
↓
Application Layer (Use Cases)
↓
Domain Layer (Rules, Physics, Invariants)
↑
Outbound Ports (Persistence, Analytics)
↑
Outbound Adapters (PSQL, Event Store)

```

---

## 3. Repository Structure (High Cohesion)

```

src/
├── domain/
│   ├── lobby/
│   │   ├── Lobby.ts
│   │   ├── LobbyState.ts
│   │   ├── Permissions.ts
│   │   └── LobbyEvents.ts
│   ├── participant/
│   │   ├── Participant.ts
│   │   └── InfluenceCharge.ts
│   ├── option/
│   │   ├── Option.ts
│   │   ├── AddedOption.ts
│   │   └── OptionPool.ts
│   ├── selection/
│   │   ├── SelectionMethod.ts
│   │   ├── Wheel.ts
│   │   ├── WheelConfig.ts
│   │   ├── Round.ts
│   │   ├── RoundState.ts
│   │   ├── Selection.ts
│   │   └── Outcome.ts
│   ├── influence/
│   │   ├── InfluenceAction.ts
│   │   └── InfluenceRules.ts
│   └── events/
│       └── DomainEvent.ts
│
├── application/
│   ├── usecases/
│   │   ├── lobby/
│   │   │   ├── CreateLobby.ts
│   │   │   ├── JoinLobby.ts
│   │   │   ├── LeaveLobby.ts
│   │   │   └── CloseLobby.ts
│   │   ├── selection/
│   │   │   ├── StartRound.ts
│   │   │   ├── ApplyInfluence.ts
│   │   │   ├── ResolveRound.ts
│   │   │   └── AdvanceRound.ts
│   │   └── option/
│   │       ├── AddOption.ts
│   │       └── RemoveOption.ts
│   └── ports/
│       ├── in/
│       │   ├── LobbyPort.ts
│       │   └── SelectionPort.ts
│       └── out/
│           ├── LobbyRepository.ts
│           └── EventPublisher.ts
│
├── adapters/
│   ├── colyseus/
│   │   ├── LobbyRoom.ts
│   │   └── state/
│   │       ├── LobbyRoomState.ts
│   │       ├── ParticipantState.ts
│   │       └── WheelState.ts
│   ├── http/
│   │   └── LobbyController.ts
│   ├── persistence/
│   │   └── PsqlLobbyRepository.ts
│   └── integrations/
│       ├── TwitchAdapter.ts
│       └── DiscordAdapter.ts
│
├── config/
│   └── compose.ts
│
└── tests/
├── domain/
└── application/

```

**Rule:**  
> Files higher in the tree depend only on files below them via interfaces (ports).

---

## 4. Refined Domain Model

### Lobby (Aggregate Root)

**Responsibilities**
- Owns lifecycle and state
- Enforces permissions
- Coordinates rounds and selections

**Key Properties**
- `id`
- `state: LobbyState`
- `participants: Participant[]`
- `optionPool: OptionPool`
- `selectionMethod: SelectionMethod`
- `permissions: Permissions`
- `selectionLog`

---

### LobbyState

```

CREATED → OPEN → READY → SPINNING → ROUND_PAUSED → COMPLETED → CLOSED

```

**Invariant Examples**
- Cannot influence unless `SPINNING`
- Cannot add options after `READY`
- Cannot start round unless minimum options met

---

### Participant

**Properties**
- `id`
- `role` (Host | Viewer | Contributor)
- `displayName`
- `influenceCharges`

---

### Option & AddedOption

- `Option`: conceptual choice
- `AddedOption`: option + contributor ownership

**Invariant**
- Options may be duplicated to increase odds

---

### SelectionMethod (Interface)

```

startRound()
applyInfluence(action)
tick(deltaTime)
resolveRound(): Selection

```

---

### Wheel (SelectionMethod)

**Key Characteristics**
- Deterministic physics
- No randomness outside math
- Configurable via `WheelConfig`

---

### Round

**Responsibilities**
- Temporal container for a spin
- Tracks influences and outcome

---

### InfluenceAction

**Properties**
- participantId
- type (speedUp | slowDown | brake)
- magnitude
- timestamp
- roundId

---

## 5. Application Layer (Use Cases)

Use cases orchestrate **domain objects**, not infrastructure.

### Example: ApplyInfluence

```

* Validate participant permissions
* Validate lobby state
* Consume influence charge
* Apply influence to wheel
* Emit DomainEvent

```

Adapters **never** mutate domain objects directly.

---

## 6. Colyseus Integration (Delegated Infrastructure)

### Colyseus Owns
- Client connections
- Reconnection
- State sync
- Message transport

### Domain Owns
- Authority
- Validation
- Physics
- Outcomes

### Room as Adapter

```

LobbyRoom
→ translates client messages
→ invokes application use cases
→ projects domain state into Schema

```

---

## 7. Events (Domain-Driven)

### Core Domain Events

- LobbyCreated
- LobbyStateChanged
- ParticipantJoined
- ParticipantLeft
- OptionAdded
- OptionRemoved
- RoundStarted
- InfluenceApplied
- SelectionResolved
- OutcomeSelected
- LobbyClosed

Events are:
- Stored for replay/analytics
- Broadcast via adapters
- Never UI-specific

---

## 8. Permissions Model

Permissions are:
- **Role-based**
- **State-aware**
- **Domain-enforced**

Example:
- Viewers may influence **only during SPINNING**
- Contributors may add options **only before READY**
- Host may override **only outside SPINNING**

---

## 9. Refined Milestones (Domain-Aligned)

### Milestone 1: Domain Core
- All domain models
- Physics wheel simulation
- State transitions
- Full unit test coverage

### Milestone 2: Single-Client UI
- Render wheel
- Local simulation
- Event logging

### Milestone 3: Authoritative Server
- Colyseus Room
- Server-side physics
- Late join sync

### Milestone 4: Permissions & Moderation
- Host controls
- Abuse handling
- Option locking

### Milestone 5: Integrations
- Twitch / Discord
- Overlay mode

---

## 10. Summary

This structure:
- Keeps **business logic central and cohesive**
- Uses Colyseus as a **pure transport adapter**
- Enables confident iteration and extension
- Aligns fully with Ports & Adapters best practices

**Outcome:**  
A fair, transparent, and extensible Community Randomizer whose rules remain correct no matter how the UI, server, or integrations evolve.
