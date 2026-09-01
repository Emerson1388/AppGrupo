export type Nivel = "iniciante" | "intermediario" | "avancado"
export type Role = "atleta" | "treinador" | "admin"
export type Plano = "gratuito" | "basico" | "pro" | "premium"
export type MidiaTipo = "foto" | "video" | "texto"
export type ReacaoTipo = "fiz" | "pesado" | "gostei" | "vou_fazer"
export type CheckinMetodo = "manual" | "qr"

export type Grupo = {
  id: string
  nome: string
  slug: string
  logoUrl?: string
  cidade?: string
  plano: Plano
  limiteAtletas: number
  spotifyUrl?: string
}

export type Profile = {
  id: string
  grupoId: string
  nome: string
  email: string
  fotoUrl: string
  dataNascimento?: string
  distanciaPreferida?: string
  paceMedio?: string
  nivel: Nivel
  meta?: string
  bio?: string
  role: Role
}

export type Treino = {
  id: string
  grupoId: string
  titulo: string
  tipo: string
  descricao?: string
  data: string
  horario: string
  local: string
  distanciaKm: number
  paceSugerido?: string
  nivel: Nivel
  observacoes?: string
  treinadorId?: string
  qrToken: string
  criadoPor: string
}

export type Participacao = {
  usuarioId: string
  treinoId: string
  createdAt: string
}

export type Checkin = {
  id: string
  usuarioId: string
  treinoId: string
  dataHora: string
  status: "presente"
  metodo: CheckinMetodo
}

export type Publicacao = {
  id: string
  grupoId: string
  usuarioId: string
  texto: string
  midiaUrl?: string
  tipo: MidiaTipo
  distanciaKm?: number
  createdAt: string
}

export type Mensagem = {
  id: string
  deId: string
  paraId: string
  texto: string
  createdAt: string
  lida: boolean
}

export type Curtida = {
  usuarioId: string
  publicacaoId: string
}

export type Comentario = {
  id: string
  usuarioId: string
  publicacaoId: string
  texto: string
  createdAt: string
}

export type Sugestao = {
  id: string
  grupoId: string
  titulo: string
  descricao: string
  nivel: Nivel
  criadoPor: string
  createdAt: string
}

export type ReacaoSugestao = {
  usuarioId: string
  sugestaoId: string
  tipo: ReacaoTipo
}

export type Conquista = {
  id: string
  codigo: string
  titulo: string
  descricao: string
  icone: string
}

export type UsuarioConquista = {
  usuarioId: string
  conquistaId: string
  unlockedAt: string
}

export type Story = {
  id: string
  grupoId: string
  usuarioId: string
  midiaUrl: string
  texto?: string
  createdAt: string
  expiresAt: string
  viewedBy: string[]
}

export type AppData = {
  grupo: Grupo
  profiles: Profile[]
  treinos: Treino[]
  participacoes: Participacao[]
  checkins: Checkin[]
  publicacoes: Publicacao[]
  curtidas: Curtida[]
  comentarios: Comentario[]
  sugestoes: Sugestao[]
  reacoes: ReacaoSugestao[]
  conquistas: Conquista[]
  usuarioConquistas: UsuarioConquista[]
  mensagens: Mensagem[]
  stories: Story[]
  currentUserId: string | null
}
