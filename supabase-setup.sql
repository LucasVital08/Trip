--
-- PostgreSQL database dump
--


-- Dumped from database version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: BookingStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BookingStatus" AS ENUM (
    'PENDING_PAYMENT',
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED_BY_PASSENGER',
    'CANCELLED_BY_DRIVER',
    'EXPIRED'
);


--
-- Name: ExperienceTier; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ExperienceTier" AS ENUM (
    'ECONOMICO',
    'CONFORTO',
    'PREMIUM'
);


--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'PIX',
    'CARD'
);


--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'PAID',
    'FAILED',
    'REFUNDED',
    'PARTIALLY_REFUNDED'
);


--
-- Name: PayoutStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PayoutStatus" AS ENUM (
    'HELD',
    'RELEASED',
    'PAID',
    'REVERSED'
);


--
-- Name: ReportStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReportStatus" AS ENUM (
    'OPEN',
    'UNDER_REVIEW',
    'RESOLVED',
    'DISMISSED'
);


--
-- Name: ReviewDirection; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReviewDirection" AS ENUM (
    'PASSENGER_TO_DRIVER',
    'DRIVER_TO_PASSENGER'
);


--
-- Name: TripStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TripStatus" AS ENUM (
    'PUBLISHED',
    'FULL',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: VehicleCategory; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."VehicleCategory" AS ENUM (
    'HATCH',
    'SEDAN',
    'SUV',
    'MINIVAN',
    'PICKUP'
);


--
-- Name: VerificationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."VerificationStatus" AS ENUM (
    'UNVERIFIED',
    'PENDING',
    'VERIFIED',
    'REJECTED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


--
-- Name: Amenity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Amenity" (
    id text NOT NULL,
    slug text NOT NULL,
    label text NOT NULL,
    icon text NOT NULL,
    description text,
    "tierWeight" integer DEFAULT 1 NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL
);


--
-- Name: Booking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Booking" (
    id text NOT NULL,
    code text NOT NULL,
    "tripId" text NOT NULL,
    "passengerId" text NOT NULL,
    seats integer NOT NULL,
    status public."BookingStatus" DEFAULT 'PENDING_PAYMENT'::public."BookingStatus" NOT NULL,
    "pricePerSeatCents" integer NOT NULL,
    "subtotalCents" integer NOT NULL,
    "serviceFeeCents" integer NOT NULL,
    "totalCents" integer NOT NULL,
    "shareToken" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "cancelledAt" timestamp(3) without time zone,
    "cancelReason" text
);


--
-- Name: City; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."City" (
    id text NOT NULL,
    name text NOT NULL,
    state text NOT NULL,
    slug text NOT NULL,
    lat double precision NOT NULL,
    lng double precision NOT NULL
);


--
-- Name: Conversation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Conversation" (
    id text NOT NULL,
    "tripId" text NOT NULL,
    "passengerId" text NOT NULL,
    "driverId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: DriverProfile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DriverProfile" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "cnhNumber" text NOT NULL,
    "cnhCategory" text NOT NULL,
    "cnhExpiresAt" timestamp(3) without time zone NOT NULL,
    status public."VerificationStatus" DEFAULT 'PENDING'::public."VerificationStatus" NOT NULL,
    "tripMessage" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Favorite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Favorite" (
    "userId" text NOT NULL,
    "tripId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: IdentityVerification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."IdentityVerification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    provider text NOT NULL,
    "providerRef" text,
    status public."VerificationStatus" DEFAULT 'PENDING'::public."VerificationStatus" NOT NULL,
    "documentUrl" text,
    "selfieUrl" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "reviewedAt" timestamp(3) without time zone
);


--
-- Name: Message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "senderId" text NOT NULL,
    body text NOT NULL,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Payment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    provider text NOT NULL,
    "providerRef" text,
    method public."PaymentMethod" NOT NULL,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "amountCents" integer NOT NULL,
    "serviceFeeCents" integer NOT NULL,
    "driverAmountCents" integer NOT NULL,
    "pixQrCode" text,
    "cardLast4" text,
    "paidAt" timestamp(3) without time zone,
    "refundedAt" timestamp(3) without time zone,
    "refundCents" integer,
    "failReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Payout; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Payout" (
    id text NOT NULL,
    "driverId" text NOT NULL,
    "bookingId" text NOT NULL,
    "amountCents" integer NOT NULL,
    status public."PayoutStatus" DEFAULT 'HELD'::public."PayoutStatus" NOT NULL,
    "releasedAt" timestamp(3) without time zone,
    "paidAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Report; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Report" (
    id text NOT NULL,
    "reporterId" text NOT NULL,
    "targetUserId" text NOT NULL,
    "tripId" text,
    reason text NOT NULL,
    details text,
    status public."ReportStatus" DEFAULT 'OPEN'::public."ReportStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "resolvedAt" timestamp(3) without time zone
);


--
-- Name: Review; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Review" (
    id text NOT NULL,
    "tripId" text NOT NULL,
    "bookingId" text NOT NULL,
    "authorId" text NOT NULL,
    "targetId" text NOT NULL,
    direction public."ReviewDirection" NOT NULL,
    rating integer NOT NULL,
    comment text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Trip; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Trip" (
    id text NOT NULL,
    "driverId" text NOT NULL,
    "vehicleId" text NOT NULL,
    status public."TripStatus" DEFAULT 'PUBLISHED'::public."TripStatus" NOT NULL,
    "originCity" text NOT NULL,
    "originState" text NOT NULL,
    "originLat" double precision NOT NULL,
    "originLng" double precision NOT NULL,
    "destCity" text NOT NULL,
    "destState" text NOT NULL,
    "destLat" double precision NOT NULL,
    "destLng" double precision NOT NULL,
    "departAt" timestamp(3) without time zone NOT NULL,
    "arriveEstAt" timestamp(3) without time zone NOT NULL,
    "distanceKm" integer NOT NULL,
    "durationMin" integer NOT NULL,
    "meetingPoint" text NOT NULL,
    "dropoffPoint" text,
    notes text,
    "seatsTotal" integer NOT NULL,
    "seatsAvailable" integer NOT NULL,
    "pricePerSeatCents" integer NOT NULL,
    tier public."ExperienceTier" DEFAULT 'ECONOMICO'::public."ExperienceTier" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "cancelledAt" timestamp(3) without time zone
);


--
-- Name: TripAmenity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TripAmenity" (
    "tripId" text NOT NULL,
    "amenityId" text NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    "passwordHash" text,
    phone text,
    "phoneVerified" timestamp(3) without time zone,
    "avatarUrl" text,
    bio text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "identityStatus" public."VerificationStatus" DEFAULT 'UNVERIFIED'::public."VerificationStatus" NOT NULL,
    "safetyContactName" text,
    "safetyContactPhone" text,
    "driverRatingAvg" double precision DEFAULT 0 NOT NULL,
    "driverRatingCount" integer DEFAULT 0 NOT NULL,
    "passengerRatingAvg" double precision DEFAULT 0 NOT NULL,
    "passengerRatingCnt" integer DEFAULT 0 NOT NULL,
    "blockedAt" timestamp(3) without time zone
);


--
-- Name: Vehicle; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Vehicle" (
    id text NOT NULL,
    "ownerId" text NOT NULL,
    brand text NOT NULL,
    model text NOT NULL,
    year integer NOT NULL,
    color text NOT NULL,
    plate text NOT NULL,
    category public."VehicleCategory" DEFAULT 'HATCH'::public."VehicleCategory" NOT NULL,
    seats integer DEFAULT 4 NOT NULL,
    photos text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Amenity; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Amenity" VALUES ('cmrexyczd000k7dg4ip1299kw', 'ar-condicionado', 'Ar-condicionado', 'snowflake', 'Climatização ligada durante toda a viagem.', 2, 1, true);
INSERT INTO public."Amenity" VALUES ('cmrexyczd000l7dg4eqycl0zx', 'agua-cortesia', 'Água & bala', 'droplet', 'Cortesias a bordo: água gelada e balinha.', 1, 2, true);
INSERT INTO public."Amenity" VALUES ('cmrexyczd000m7dg4i6sutc78', 'musica', 'Playlist a bordo', 'music', 'Som bom na estrada — pode sugerir a playlist.', 1, 3, true);
INSERT INTO public."Amenity" VALUES ('cmrexyczd000n7dg45qdmz3hf', 'wifi', 'Wi-Fi a bordo', 'wifi', 'Internet 4G/5G compartilhada no carro.', 2, 4, true);
INSERT INTO public."Amenity" VALUES ('cmrexyczd000o7dg4dj0pjaf9', 'parada-cafe', 'Parada pra café', 'coffee', 'Parada programada pra café ou refeição.', 1, 5, true);
INSERT INTO public."Amenity" VALUES ('cmrexyczd000p7dg4sqwpmc72', 'viagem-silenciosa', 'Viagem silenciosa', 'moon', 'Motorista prefere pouca conversa — bom pra descansar.', 0, 6, true);
INSERT INTO public."Amenity" VALUES ('cmrexyczd000q7dg4s8712zgp', 'bom-papo', 'Bom papo', 'chat', 'Motorista curte conversar na estrada.', 0, 7, true);
INSERT INTO public."Amenity" VALUES ('cmrexyczd000r7dg4lfbvlg8l', 'aceita-pet', 'Aceita pet', 'paw', 'Seu bichinho pode ir junto (combine antes no chat).', 0, 8, true);
INSERT INTO public."Amenity" VALUES ('cmrexyczd000s7dg4ontip2ak', 'nao-fumante', 'Não fumante', 'nosmoke', 'Carro livre de fumaça.', 0, 9, true);
INSERT INTO public."Amenity" VALUES ('cmrexyczd000t7dg4mppx5tet', 'bagagem-extra', 'Bagagem extra', 'luggage', 'Porta-malas com espaço pra mala grande.', 1, 10, true);
INSERT INTO public."Amenity" VALUES ('cmrexyczd000u7dg4i06rscqz', 'usb', 'Carregador USB', 'plug', 'Tomada USB pra carregar o celular.', 1, 11, true);
INSERT INTO public."Amenity" VALUES ('cmrexyczd000v7dg47sjempdu', 'assento-infantil', 'Assento infantil', 'child', 'Cadeirinha disponível mediante aviso.', 1, 12, true);


--
-- Data for Name: Booking; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Booking" VALUES ('cmrexyd67004w7dg4ndfwmgq9', 'TRP-V5BHAK', 'cmrexyd63004u7dg4ktyezwra', 'cmrexyd0a001k7dg46mfygl74', 1, 'COMPLETED', 4500, 4500, 540, 5040, '186a74352c41bfac4ebbd583e95008fe', '2026-07-10 12:58:10.351', '2026-07-10 12:58:10.351', NULL, NULL);
INSERT INTO public."Booking" VALUES ('cmrexyd6k00577dg4jhr8yjyy', 'TRP-WCVRWB', 'cmrexyd6h00557dg47nsmu8w6', 'cmrexyd0d001l7dg4esjjfstz', 1, 'COMPLETED', 4500, 4500, 540, 5040, '6109a4ba304c71656e7cd9a0d32c220c', '2026-07-10 12:58:10.365', '2026-07-10 12:58:10.365', NULL, NULL);
INSERT INTO public."Booking" VALUES ('cmrexyd6v005i7dg4qb8xufsn', 'TRP-6QTWMC', 'cmrexyd6s005g7dg4ztzm0qwi', 'cmrexyd0e001m7dg4kkyovkgx', 1, 'COMPLETED', 4500, 4500, 540, 5040, '037d729221e70442eb631c5392b2a2cf', '2026-07-10 12:58:10.375', '2026-07-10 12:58:10.375', NULL, NULL);
INSERT INTO public."Booking" VALUES ('cmrexyd76005t7dg4vk7trx1n', 'TRP-SXE34J', 'cmrexyd72005r7dg4fayy4dis', 'cmrexyd0a001k7dg46mfygl74', 1, 'COMPLETED', 6500, 6500, 780, 7280, '9add7f84d2acbe9321dad755093c691d', '2026-07-10 12:58:10.386', '2026-07-10 12:58:10.386', NULL, NULL);
INSERT INTO public."Booking" VALUES ('cmrexyd7g00647dg4xtopdq46', 'TRP-P8CJQF', 'cmrexyd7d00627dg4ctb2xjbj', 'cmrexyd0g001n7dg4iodu8axl', 1, 'COMPLETED', 6500, 6500, 780, 7280, '7c44d3524ad7789e26e5dd34a7a412a0', '2026-07-10 12:58:10.397', '2026-07-10 12:58:10.397', NULL, NULL);
INSERT INTO public."Booking" VALUES ('cmrexyd7s006f7dg4h78st97c', 'TRP-EWAU5P', 'cmrexyd7o006d7dg4c1zg4qga', 'cmrexyd0h001o7dg47k5b8g6s', 1, 'COMPLETED', 5500, 5500, 660, 6160, 'a163d40bfe5f1f1d6663843a4a87fa6a', '2026-07-10 12:58:10.408', '2026-07-10 12:58:10.408', NULL, NULL);
INSERT INTO public."Booking" VALUES ('cmrexyd82006q7dg40awotxrx', 'TRP-3TEWGD', 'cmrexyd7z006o7dg4kj15anr5', 'cmrexyd0e001m7dg4kkyovkgx', 1, 'COMPLETED', 4000, 4000, 480, 4480, '75fdc91131bcb0769bc9034feb25602e', '2026-07-10 12:58:10.419', '2026-07-10 12:58:10.419', NULL, NULL);
INSERT INTO public."Booking" VALUES ('cmrexyd8b00717dg43gkbuxmi', 'TRP-VERRJS', 'cmrexyd88006z7dg4mmsfs5m1', 'cmrexyd0d001l7dg4esjjfstz', 1, 'COMPLETED', 7500, 7500, 900, 8400, '223a500ea5dcf28cd09f9927519adc20', '2026-07-10 12:58:10.427', '2026-07-10 12:58:10.427', NULL, NULL);
INSERT INTO public."Booking" VALUES ('cmrexyd8l007c7dg49opv0uoi', 'TRP-BNZFFE', 'cmrexyd8h007a7dg4jvne66s8', 'cmrexyd0g001n7dg4iodu8axl', 1, 'COMPLETED', 13000, 13000, 1560, 14560, '4b5e71817a210ecc6148729687ce7f0a', '2026-07-10 12:58:10.437', '2026-07-10 12:58:10.437', NULL, NULL);
INSERT INTO public."Booking" VALUES ('cmrexyd8w007n7dg4mk0zucb8', 'TRP-4A9XCG', 'cmrexyd8s007l7dg4hb350zu5', 'cmrexyd0a001k7dg46mfygl74', 1, 'COMPLETED', 5000, 5000, 600, 5600, '7158ee1db6d2911474fe10501a0c2b05', '2026-07-10 12:58:10.448', '2026-07-10 12:58:10.448', NULL, NULL);
INSERT INTO public."Booking" VALUES ('cmrexyd98007y7dg44gzzsruz', 'TRP-A8CNZS', 'cmrexyd93007w7dg4tdbiqtdp', 'cmrexyd0h001o7dg47k5b8g6s', 1, 'COMPLETED', 6000, 6000, 720, 6720, '5e65363c1b7ad1ecc6035f2bf56d9247', '2026-07-10 12:58:10.46', '2026-07-10 12:58:10.46', NULL, NULL);
INSERT INTO public."Booking" VALUES ('cmrexyd9i00897dg4iqd41pqu', 'TRP-XW4RM9', 'cmrexyd9f00877dg4vdq1otux', 'cmrexyd0d001l7dg4esjjfstz', 1, 'COMPLETED', 6000, 6000, 720, 6720, '5177b8cc584a5b98842e48b63bbd7d7f', '2026-07-10 12:58:10.471', '2026-07-10 12:58:10.471', NULL, NULL);
INSERT INTO public."Booking" VALUES ('cmrexydb6008i7dg4imi5yiri', 'TRP-GPVVAB', 'cmrexyd0z00267dg4j1zgehrx', 'cmrexyd0a001k7dg46mfygl74', 1, 'CONFIRMED', 4500, 4500, 540, 5040, 'd4e7d28b835cea8bf814ae98dfdcc93d', '2026-07-10 12:58:10.53', '2026-07-10 12:58:10.53', NULL, NULL);


--
-- Data for Name: City; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."City" VALUES ('cmrexycz900007dg413jx8ld4', 'Recife', 'PE', 'recife', -8.0476, -34.877);
INSERT INTO public."City" VALUES ('cmrexycz900017dg4hvd6ndd6', 'Olinda', 'PE', 'olinda', -8.0089, -34.8553);
INSERT INTO public."City" VALUES ('cmrexycz900027dg465i1rk88', 'Caruaru', 'PE', 'caruaru', -8.2835, -35.976);
INSERT INTO public."City" VALUES ('cmrexycz900037dg4lkrbxh90', 'Garanhuns', 'PE', 'garanhuns', -8.8903, -36.4928);
INSERT INTO public."City" VALUES ('cmrexycz900047dg4acr29yx8', 'Petrolina', 'PE', 'petrolina', -9.3891, -40.5031);
INSERT INTO public."City" VALUES ('cmrexycz900057dg4o1z2wb2n', 'Porto de Galinhas', 'PE', 'porto-de-galinhas', -8.5045, -35.0076);
INSERT INTO public."City" VALUES ('cmrexycz900067dg4v26s89vo', 'João Pessoa', 'PB', 'joao-pessoa', -7.1195, -34.845);
INSERT INTO public."City" VALUES ('cmrexycz900077dg4vh16ibff', 'Campina Grande', 'PB', 'campina-grande', -7.2306, -35.8811);
INSERT INTO public."City" VALUES ('cmrexycz900087dg4k0ziv5bq', 'Natal', 'RN', 'natal', -5.7945, -35.211);
INSERT INTO public."City" VALUES ('cmrexycz900097dg4ktq46xwv', 'Mossoró', 'RN', 'mossoro', -5.1878, -37.3442);
INSERT INTO public."City" VALUES ('cmrexycz9000a7dg4tk8axx4d', 'Pipa', 'RN', 'pipa', -6.2283, -35.0458);
INSERT INTO public."City" VALUES ('cmrexycz9000b7dg4zpruc8zm', 'Fortaleza', 'CE', 'fortaleza', -3.7172, -38.5433);
INSERT INTO public."City" VALUES ('cmrexycz9000c7dg4wy9vuy6w', 'Juazeiro do Norte', 'CE', 'juazeiro-do-norte', -7.2131, -39.3153);
INSERT INTO public."City" VALUES ('cmrexycz9000d7dg4l8fht767', 'Maceió', 'AL', 'maceio', -9.6499, -35.7089);
INSERT INTO public."City" VALUES ('cmrexycz9000e7dg4phh1sn20', 'Arapiraca', 'AL', 'arapiraca', -9.7519, -36.6608);
INSERT INTO public."City" VALUES ('cmrexycz9000f7dg4uqe606xe', 'Aracaju', 'SE', 'aracaju', -10.9095, -37.0748);
INSERT INTO public."City" VALUES ('cmrexycz9000g7dg449pqh4u3', 'Salvador', 'BA', 'salvador', -12.9714, -38.5014);
INSERT INTO public."City" VALUES ('cmrexycz9000h7dg4mm57whzz', 'Feira de Santana', 'BA', 'feira-de-santana', -12.2664, -38.9663);
INSERT INTO public."City" VALUES ('cmrexycz9000i7dg4xsdgabk1', 'Teresina', 'PI', 'teresina', -5.0892, -42.8016);
INSERT INTO public."City" VALUES ('cmrexycz9000j7dg43mratdh3', 'São Luís', 'MA', 'sao-luis', -2.5307, -44.3068);


--
-- Data for Name: Conversation; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Conversation" VALUES ('cmrexydbc008n7dg41jwsnzvc', 'cmrexyd0z00267dg4j1zgehrx', 'cmrexyd0a001k7dg46mfygl74', 'cmrexyczi000w7dg4l529tmti', '2026-07-10 12:58:10.536', '2026-07-10 12:58:10.536');


--
-- Data for Name: DriverProfile; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."DriverProfile" VALUES ('cmrexyczi000x7dg4vqfcg6bp', 'cmrexyczi000w7dg4l529tmti', '11438034870', 'B', '2030-06-30 00:00:00', 'VERIFIED', 'Faço Recife–Caruaru toda semana a trabalho. Dirijo há 12 anos, zero multas. Café na Pousada do Ló é parada obrigatória.', '2026-07-10 12:58:10.111', '2026-07-10 12:58:10.111');
INSERT INTO public."DriverProfile" VALUES ('cmrexyczo00107dg4050xbai1', 'cmrexyczo000z7dg4dd2wvdwd', '10000472972', 'B', '2030-06-30 00:00:00', 'VERIFIED', 'Professora em Campina, família em João Pessoa. Viagem tranquila, playlist de MPB e ar sempre ligado.', '2026-07-10 12:58:10.116', '2026-07-10 12:58:10.116');
INSERT INTO public."DriverProfile" VALUES ('cmrexyczr00137dg4v5ir26x5', 'cmrexyczr00127dg4z2zrtemd', '10567213676', 'B', '2030-06-30 00:00:00', 'VERIFIED', 'Representante comercial. Rodo o litoral todo mês — Compass confortável, Wi-Fi e água gelada pra todo mundo.', '2026-07-10 12:58:10.12', '2026-07-10 12:58:10.12');
INSERT INTO public."DriverProfile" VALUES ('cmrexyczv00167dg4n3n8p37t', 'cmrexyczv00157dg4srl96wh1', '11413363959', 'B', '2030-06-30 00:00:00', 'VERIFIED', 'Desço pra Maceió quase todo fim de semana. Gosto de sair cedinho pra pegar o nascer do sol na BR-101.', '2026-07-10 12:58:10.123', '2026-07-10 12:58:10.123');
INSERT INTO public."DriverProfile" VALUES ('cmrexyczz00197dg4hf31gggl', 'cmrexyczy00187dg4flee2c9m', '11153604268', 'B', '2030-06-30 00:00:00', 'VERIFIED', 'Motorista aposentado do transporte escolar. Paciência de Jó, direção defensiva e muita história boa.', '2026-07-10 12:58:10.127', '2026-07-10 12:58:10.127');
INSERT INTO public."DriverProfile" VALUES ('cmrexyd02001c7dg4yrgxvdgm', 'cmrexyd02001b7dg4au2mkw2n', '10290043548', 'B', '2030-06-30 00:00:00', 'VERIFIED', 'Estudante de medicina, volto pra Garanhuns nas folgas. Viagem silenciosa: ideal pra quem quer dormir.', '2026-07-10 12:58:10.13', '2026-07-10 12:58:10.13');
INSERT INTO public."DriverProfile" VALUES ('cmrexyd05001f7dg4sdvlkd3v', 'cmrexyd05001e7dg488p1vgwn', '10041422417', 'B', '2030-06-30 00:00:00', 'VERIFIED', 'Fortaleza–Natal com estilo: SUV nova, banco de couro, cafezinho na Canoa Quebrada quando dá tempo.', '2026-07-10 12:58:10.133', '2026-07-10 12:58:10.133');
INSERT INTO public."DriverProfile" VALUES ('cmrexyd08001i7dg4k8jjzny3', 'cmrexyd07001h7dg4uafb9fpm', '11421759052', 'B', '2030-06-30 00:00:00', 'VERIFIED', 'Fotógrafa de casamentos rodando o NE. Aceito pet de boa — a Nina (vira-lata caramelo) às vezes vai junto.', '2026-07-10 12:58:10.136', '2026-07-10 12:58:10.136');


--
-- Data for Name: Favorite; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Favorite" VALUES ('cmrexyd0a001k7dg46mfygl74', 'cmrexyd27002u7dg4mh5k5pyl', '2026-07-10 12:58:10.547');
INSERT INTO public."Favorite" VALUES ('cmrexyd0a001k7dg46mfygl74', 'cmrexyd2b002w7dg4mnmkpak1', '2026-07-10 12:58:10.55');
INSERT INTO public."Favorite" VALUES ('cmrexyd0a001k7dg46mfygl74', 'cmrexyd2f002y7dg4rjqnae3k', '2026-07-10 12:58:10.551');


--
-- Data for Name: IdentityVerification; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."IdentityVerification" VALUES ('cmrexyczi000y7dg4bgg8fsgo', 'cmrexyczi000w7dg4l529tmti', 'mock', 'seed_joao', 'VERIFIED', NULL, NULL, 'Verificação de identidade aprovada (seed).', '2026-07-10 12:58:10.111', '2026-07-10 12:58:10.109');
INSERT INTO public."IdentityVerification" VALUES ('cmrexyczo00117dg4g74eiiuo', 'cmrexyczo000z7dg4dd2wvdwd', 'mock', 'seed_carla', 'VERIFIED', NULL, NULL, 'Verificação de identidade aprovada (seed).', '2026-07-10 12:58:10.116', '2026-07-10 12:58:10.115');
INSERT INTO public."IdentityVerification" VALUES ('cmrexyczr00147dg4gl57hh6g', 'cmrexyczr00127dg4z2zrtemd', 'mock', 'seed_rafael', 'VERIFIED', NULL, NULL, 'Verificação de identidade aprovada (seed).', '2026-07-10 12:58:10.12', '2026-07-10 12:58:10.119');
INSERT INTO public."IdentityVerification" VALUES ('cmrexyczv00177dg4ycavpkp7', 'cmrexyczv00157dg4srl96wh1', 'mock', 'seed_ana', 'VERIFIED', NULL, NULL, 'Verificação de identidade aprovada (seed).', '2026-07-10 12:58:10.123', '2026-07-10 12:58:10.122');
INSERT INTO public."IdentityVerification" VALUES ('cmrexyczz001a7dg4rr17tt3a', 'cmrexyczy00187dg4flee2c9m', 'mock', 'seed_marcos', 'VERIFIED', NULL, NULL, 'Verificação de identidade aprovada (seed).', '2026-07-10 12:58:10.127', '2026-07-10 12:58:10.126');
INSERT INTO public."IdentityVerification" VALUES ('cmrexyd02001d7dg49a905iba', 'cmrexyd02001b7dg4au2mkw2n', 'mock', 'seed_julia', 'VERIFIED', NULL, NULL, 'Verificação de identidade aprovada (seed).', '2026-07-10 12:58:10.13', '2026-07-10 12:58:10.129');
INSERT INTO public."IdentityVerification" VALUES ('cmrexyd05001g7dg4ylu8vt3k', 'cmrexyd05001e7dg488p1vgwn', 'mock', 'seed_pedro', 'VERIFIED', NULL, NULL, 'Verificação de identidade aprovada (seed).', '2026-07-10 12:58:10.133', '2026-07-10 12:58:10.132');
INSERT INTO public."IdentityVerification" VALUES ('cmrexyd08001j7dg4a51ycx8x', 'cmrexyd07001h7dg4uafb9fpm', 'mock', 'seed_livia', 'VERIFIED', NULL, NULL, 'Verificação de identidade aprovada (seed).', '2026-07-10 12:58:10.136', '2026-07-10 12:58:10.135');


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Message" VALUES ('cmrexydbf008p7dg4j34b8ane', 'cmrexydbc008n7dg41jwsnzvc', 'cmrexyd0a001k7dg46mfygl74', 'Oi João! Reservei um lugar. Posso embarcar no Derby em vez da Zona Sul?', '2026-07-10 12:58:10.538', '2026-07-10 12:58:10.539');
INSERT INTO public."Message" VALUES ('cmrexydbh008r7dg4i88126sl', 'cmrexydbc008n7dg41jwsnzvc', 'cmrexyczi000w7dg4l529tmti', 'Oi Marina! Pode sim, passo pelo Derby umas 6h15. Te espero em frente ao quiosque do parque.', '2026-07-10 12:58:10.541', '2026-07-10 12:58:10.542');
INSERT INTO public."Message" VALUES ('cmrexydbj008t7dg4unixp13q', 'cmrexydbc008n7dg41jwsnzvc', 'cmrexyd0a001k7dg46mfygl74', 'Perfeito, combinado! Levo só uma mochila.', '2026-07-10 12:58:10.543', '2026-07-10 12:58:10.544');
INSERT INTO public."Message" VALUES ('cmrexydbl008v7dg49jyzm5r0', 'cmrexydbc008n7dg41jwsnzvc', 'cmrexyczi000w7dg4l529tmti', 'Ótimo. Qualquer coisa me chama por aqui. Boa viagem pra gente! 🚗', '2026-07-10 12:58:10.545', '2026-07-10 12:58:10.546');


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Payment" VALUES ('cmrexyd67004x7dg4trirpsg9', 'cmrexyd67004w7dg4ndfwmgq9', 'mock', 'seed_pay_yezwra', 'PIX', 'PAID', 5040, 540, 4500, NULL, NULL, '2026-07-06 06:00:00', NULL, NULL, NULL, '2026-07-10 12:58:10.351', '2026-07-10 12:58:10.351');
INSERT INTO public."Payment" VALUES ('cmrexyd6k00587dg4vmggxef0', 'cmrexyd6k00577dg4jhr8yjyy', 'mock', 'seed_pay_smu8w6', 'CARD', 'PAID', 5040, 540, 4500, NULL, '4242', '2026-07-01 06:00:00', NULL, NULL, NULL, '2026-07-10 12:58:10.365', '2026-07-10 12:58:10.365');
INSERT INTO public."Payment" VALUES ('cmrexyd6v005j7dg4bmgfkxzr', 'cmrexyd6v005i7dg4qb8xufsn', 'mock', 'seed_pay_zm0qwi', 'PIX', 'PAID', 5040, 540, 4500, NULL, NULL, '2026-06-26 06:00:00', NULL, NULL, NULL, '2026-07-10 12:58:10.375', '2026-07-10 12:58:10.375');
INSERT INTO public."Payment" VALUES ('cmrexyd76005u7dg4zxldnmgh', 'cmrexyd76005t7dg4vk7trx1n', 'mock', 'seed_pay_yy4dis', 'CARD', 'PAID', 7280, 780, 6500, NULL, '4242', '2026-06-21 08:00:00', NULL, NULL, NULL, '2026-07-10 12:58:10.386', '2026-07-10 12:58:10.386');
INSERT INTO public."Payment" VALUES ('cmrexyd7h00657dg4whk3mwhs', 'cmrexyd7g00647dg4xtopdq46', 'mock', 'seed_pay_b2xjbj', 'PIX', 'PAID', 7280, 780, 6500, NULL, NULL, '2026-06-16 08:00:00', NULL, NULL, NULL, '2026-07-10 12:58:10.397', '2026-07-10 12:58:10.397');
INSERT INTO public."Payment" VALUES ('cmrexyd7s006g7dg44grjo0cl', 'cmrexyd7s006f7dg4h78st97c', 'mock', 'seed_pay_zg4qga', 'CARD', 'PAID', 6160, 660, 5500, NULL, '4242', '2026-06-11 09:00:00', NULL, NULL, NULL, '2026-07-10 12:58:10.408', '2026-07-10 12:58:10.408');
INSERT INTO public."Payment" VALUES ('cmrexyd82006r7dg45v8ts10j', 'cmrexyd82006q7dg40awotxrx', 'mock', 'seed_pay_15anr5', 'PIX', 'PAID', 4480, 480, 4000, NULL, NULL, '2026-06-06 07:00:00', NULL, NULL, NULL, '2026-07-10 12:58:10.419', '2026-07-10 12:58:10.419');
INSERT INTO public."Payment" VALUES ('cmrexyd8b00727dg4nzfzitbc', 'cmrexyd8b00717dg43gkbuxmi', 'mock', 'seed_pay_sfs5m1', 'CARD', 'PAID', 8400, 900, 7500, NULL, '4242', '2026-06-01 05:00:00', NULL, NULL, NULL, '2026-07-10 12:58:10.427', '2026-07-10 12:58:10.427');
INSERT INTO public."Payment" VALUES ('cmrexyd8l007d7dg4p9m6vtcr', 'cmrexyd8l007c7dg49opv0uoi', 'mock', 'seed_pay_ne66s8', 'PIX', 'PAID', 14560, 1560, 13000, NULL, NULL, '2026-05-27 07:00:00', NULL, NULL, NULL, '2026-07-10 12:58:10.437', '2026-07-10 12:58:10.437');
INSERT INTO public."Payment" VALUES ('cmrexyd8w007o7dg45ruhtpit', 'cmrexyd8w007n7dg4mk0zucb8', 'mock', 'seed_pay_350zu5', 'CARD', 'PAID', 5600, 600, 5000, NULL, '4242', '2026-05-22 13:00:00', NULL, NULL, NULL, '2026-07-10 12:58:10.448', '2026-07-10 12:58:10.448');
INSERT INTO public."Payment" VALUES ('cmrexyd98007z7dg4rl69q1cb', 'cmrexyd98007y7dg44gzzsruz', 'mock', 'seed_pay_biqtdp', 'PIX', 'PAID', 6720, 720, 6000, NULL, NULL, '2026-05-17 08:00:00', NULL, NULL, NULL, '2026-07-10 12:58:10.46', '2026-07-10 12:58:10.46');
INSERT INTO public."Payment" VALUES ('cmrexyd9j008a7dg4ridehfg2', 'cmrexyd9i00897dg4iqd41pqu', 'mock', 'seed_pay_q1otux', 'CARD', 'PAID', 6720, 720, 6000, NULL, '4242', '2026-05-12 08:00:00', NULL, NULL, NULL, '2026-07-10 12:58:10.471', '2026-07-10 12:58:10.471');
INSERT INTO public."Payment" VALUES ('cmrexydb6008j7dg47h5f949l', 'cmrexydb6008i7dg4imi5yiri', 'mock', 'seed_pay_demo', 'PIX', 'PAID', 5040, 540, 4500, NULL, NULL, '2026-07-10 12:58:10.529', NULL, NULL, NULL, '2026-07-10 12:58:10.53', '2026-07-10 12:58:10.53');


--
-- Data for Name: Payout; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Payout" VALUES ('cmrexyd67004z7dg4wv8afcqi', 'cmrexyczi000w7dg4l529tmti', 'cmrexyd67004w7dg4ndfwmgq9', 4500, 'PAID', '2026-07-07 09:04:00', '2026-07-09 06:00:00', '2026-07-10 12:58:10.351');
INSERT INTO public."Payout" VALUES ('cmrexyd6k005a7dg49zdkma5a', 'cmrexyczi000w7dg4l529tmti', 'cmrexyd6k00577dg4jhr8yjyy', 4500, 'PAID', '2026-07-02 09:04:00', '2026-07-04 06:00:00', '2026-07-10 12:58:10.365');
INSERT INTO public."Payout" VALUES ('cmrexyd6v005l7dg4itcrybut', 'cmrexyczi000w7dg4l529tmti', 'cmrexyd6v005i7dg4qb8xufsn', 4500, 'PAID', '2026-06-27 09:04:00', '2026-06-29 06:00:00', '2026-07-10 12:58:10.375');
INSERT INTO public."Payout" VALUES ('cmrexyd76005w7dg4q1kljn9x', 'cmrexyczr00127dg4z2zrtemd', 'cmrexyd76005t7dg4vk7trx1n', 6500, 'PAID', '2026-06-22 10:43:00', '2026-06-24 08:00:00', '2026-07-10 12:58:10.386');
INSERT INTO public."Payout" VALUES ('cmrexyd7h00677dg407028tme', 'cmrexyczr00127dg4z2zrtemd', 'cmrexyd7g00647dg4xtopdq46', 6500, 'PAID', '2026-06-17 10:43:00', '2026-06-19 08:00:00', '2026-07-10 12:58:10.397');
INSERT INTO public."Payout" VALUES ('cmrexyd7s006i7dg4pcc6jrf3', 'cmrexyczy00187dg4flee2c9m', 'cmrexyd7s006f7dg4h78st97c', 5500, 'PAID', '2026-06-12 14:06:00', '2026-06-14 09:00:00', '2026-07-10 12:58:10.408');
INSERT INTO public."Payout" VALUES ('cmrexyd82006t7dg44n80f0vy', 'cmrexyczo000z7dg4dd2wvdwd', 'cmrexyd82006q7dg40awotxrx', 4000, 'PAID', '2026-06-07 09:55:00', '2026-06-09 07:00:00', '2026-07-10 12:58:10.419');
INSERT INTO public."Payout" VALUES ('cmrexyd8b00747dg467b0iu77', 'cmrexyczv00157dg4srl96wh1', 'cmrexyd8b00717dg43gkbuxmi', 7500, 'PAID', '2026-06-02 09:20:00', '2026-06-04 05:00:00', '2026-07-10 12:58:10.427');
INSERT INTO public."Payout" VALUES ('cmrexyd8l007f7dg416mz0upv', 'cmrexyd05001e7dg488p1vgwn', 'cmrexyd8l007c7dg49opv0uoi', 13000, 'PAID', '2026-05-28 15:15:00', '2026-05-30 07:00:00', '2026-07-10 12:58:10.437');
INSERT INTO public."Payout" VALUES ('cmrexyd8w007q7dg4odhzn7uk', 'cmrexyd02001b7dg4au2mkw2n', 'cmrexyd8w007n7dg4mk0zucb8', 5000, 'PAID', '2026-05-23 17:21:00', '2026-05-25 13:00:00', '2026-07-10 12:58:10.448');
INSERT INTO public."Payout" VALUES ('cmrexyd9800817dg411h07ssp', 'cmrexyd07001h7dg4uafb9fpm', 'cmrexyd98007y7dg44gzzsruz', 6000, 'PAID', '2026-05-18 12:25:00', '2026-05-20 08:00:00', '2026-07-10 12:58:10.46');
INSERT INTO public."Payout" VALUES ('cmrexyd9j008c7dg4xs3sqicg', 'cmrexyd07001h7dg4uafb9fpm', 'cmrexyd9i00897dg4iqd41pqu', 6000, 'PAID', '2026-05-13 12:25:00', '2026-05-15 08:00:00', '2026-07-10 12:58:10.471');
INSERT INTO public."Payout" VALUES ('cmrexydb6008l7dg4pu9b79nf', 'cmrexyczi000w7dg4l529tmti', 'cmrexydb6008i7dg4imi5yiri', 4500, 'HELD', NULL, NULL, '2026-07-10 12:58:10.53');


--
-- Data for Name: Report; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Review; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Review" VALUES ('cmrexyd6c00517dg41sra8a0t', 'cmrexyd63004u7dg4ktyezwra', 'cmrexyd67004w7dg4ndfwmgq9', 'cmrexyd0a001k7dg46mfygl74', 'cmrexyczi000w7dg4l529tmti', 'PASSENGER_TO_DRIVER', 5, 'Viagem impecável. João é pontual, o carro estava limpo e o ar geladinho. Recomendo demais!', '2026-07-07 10:04:00');
INSERT INTO public."Review" VALUES ('cmrexyd6f00537dg40k2c1nue', 'cmrexyd63004u7dg4ktyezwra', 'cmrexyd67004w7dg4ndfwmgq9', 'cmrexyczi000w7dg4l529tmti', 'cmrexyd0a001k7dg46mfygl74', 'DRIVER_TO_PASSENGER', 5, 'Passageiro(a) pontual e educado(a). Viagem tranquila!', '2026-07-07 11:04:00');
INSERT INTO public."Review" VALUES ('cmrexyd6n005c7dg4cn80v9i6', 'cmrexyd6h00557dg47nsmu8w6', 'cmrexyd6k00577dg4jhr8yjyy', 'cmrexyd0d001l7dg4esjjfstz', 'cmrexyczi000w7dg4l529tmti', 'PASSENGER_TO_DRIVER', 5, 'Papo bom da saída à chegada. Parada pro café no meio do caminho foi um bônus.', '2026-07-02 10:04:00');
INSERT INTO public."Review" VALUES ('cmrexyd6p005e7dg4octcj58z', 'cmrexyd6h00557dg47nsmu8w6', 'cmrexyd6k00577dg4jhr8yjyy', 'cmrexyczi000w7dg4l529tmti', 'cmrexyd0d001l7dg4esjjfstz', 'DRIVER_TO_PASSENGER', 5, 'Passageiro(a) pontual e educado(a). Viagem tranquila!', '2026-07-02 11:04:00');
INSERT INTO public."Review" VALUES ('cmrexyd6y005n7dg45jcvgb22', 'cmrexyd6s005g7dg4ztzm0qwi', 'cmrexyd6v005i7dg4qb8xufsn', 'cmrexyd0e001m7dg4kkyovkgx', 'cmrexyczi000w7dg4l529tmti', 'PASSENGER_TO_DRIVER', 4, 'Tudo certo, só saímos 10 minutinhos atrasados. De resto, perfeito.', '2026-06-27 10:04:00');
INSERT INTO public."Review" VALUES ('cmrexyd70005p7dg4tagrbrqh', 'cmrexyd6s005g7dg4ztzm0qwi', 'cmrexyd6v005i7dg4qb8xufsn', 'cmrexyczi000w7dg4l529tmti', 'cmrexyd0e001m7dg4kkyovkgx', 'DRIVER_TO_PASSENGER', 5, 'Passageiro(a) pontual e educado(a). Viagem tranquila!', '2026-06-27 11:04:00');
INSERT INTO public."Review" VALUES ('cmrexyd79005y7dg4wccfjko5', 'cmrexyd72005r7dg4fayy4dis', 'cmrexyd76005t7dg4vk7trx1n', 'cmrexyd0a001k7dg46mfygl74', 'cmrexyczr00127dg4z2zrtemd', 'PASSENGER_TO_DRIVER', 5, 'O Compass é outro nível — Wi-Fi funcionando de verdade e água gelada. Valeu cada centavo.', '2026-06-22 11:43:00');
INSERT INTO public."Review" VALUES ('cmrexyd7b00607dg45pscfy9f', 'cmrexyd72005r7dg4fayy4dis', 'cmrexyd76005t7dg4vk7trx1n', 'cmrexyczr00127dg4z2zrtemd', 'cmrexyd0a001k7dg46mfygl74', 'DRIVER_TO_PASSENGER', 5, 'Passageiro(a) pontual e educado(a). Viagem tranquila!', '2026-06-22 12:43:00');
INSERT INTO public."Review" VALUES ('cmrexyd7k00697dg4lxum4hhf', 'cmrexyd7d00627dg4ctb2xjbj', 'cmrexyd7g00647dg4xtopdq46', 'cmrexyd0g001n7dg4iodu8axl', 'cmrexyczr00127dg4z2zrtemd', 'PASSENGER_TO_DRIVER', 5, 'Melhor experiência de carona que já tive. Motorista super profissional.', '2026-06-17 11:43:00');
INSERT INTO public."Review" VALUES ('cmrexyd7m006b7dg46cwt53kf', 'cmrexyd7d00627dg4ctb2xjbj', 'cmrexyd7g00647dg4xtopdq46', 'cmrexyczr00127dg4z2zrtemd', 'cmrexyd0g001n7dg4iodu8axl', 'DRIVER_TO_PASSENGER', 5, 'Passageiro(a) pontual e educado(a). Viagem tranquila!', '2026-06-17 12:43:00');
INSERT INTO public."Review" VALUES ('cmrexyd7w006k7dg4xzmm6fhh', 'cmrexyd7o006d7dg4c1zg4qga', 'cmrexyd7s006f7dg4h78st97c', 'cmrexyd0h001o7dg47k5b8g6s', 'cmrexyczy00187dg4flee2c9m', 'PASSENGER_TO_DRIVER', 5, 'Seu Marcos é um querido. Dirige com muito cuidado e ainda ajudou com as malas.', '2026-06-12 15:06:00');
INSERT INTO public."Review" VALUES ('cmrexyd7y006m7dg44ta0nzdu', 'cmrexyd7o006d7dg4c1zg4qga', 'cmrexyd7s006f7dg4h78st97c', 'cmrexyczy00187dg4flee2c9m', 'cmrexyd0h001o7dg47k5b8g6s', 'DRIVER_TO_PASSENGER', 5, 'Passageiro(a) pontual e educado(a). Viagem tranquila!', '2026-06-12 16:06:00');
INSERT INTO public."Review" VALUES ('cmrexyd85006v7dg4r8oy1wbq', 'cmrexyd7z006o7dg4kj15anr5', 'cmrexyd82006q7dg40awotxrx', 'cmrexyd0e001m7dg4kkyovkgx', 'cmrexyczo000z7dg4dd2wvdwd', 'PASSENGER_TO_DRIVER', 5, 'Playlist ótima e conversa boa. Chegamos até antes do previsto.', '2026-06-07 10:55:00');
INSERT INTO public."Review" VALUES ('cmrexyd86006x7dg48t4qvjgl', 'cmrexyd7z006o7dg4kj15anr5', 'cmrexyd82006q7dg40awotxrx', 'cmrexyczo000z7dg4dd2wvdwd', 'cmrexyd0e001m7dg4kkyovkgx', 'DRIVER_TO_PASSENGER', 5, 'Passageiro(a) pontual e educado(a). Viagem tranquila!', '2026-06-07 11:55:00');
INSERT INTO public."Review" VALUES ('cmrexyd8e00767dg49lwffj90', 'cmrexyd88006z7dg4mmsfs5m1', 'cmrexyd8b00717dg43gkbuxmi', 'cmrexyd0d001l7dg4esjjfstz', 'cmrexyczv00157dg4srl96wh1', 'PASSENGER_TO_DRIVER', 4, 'Saída pontual às 5h. Vi o nascer do sol na BR-101 — experiência linda.', '2026-06-02 10:20:00');
INSERT INTO public."Review" VALUES ('cmrexyd8g00787dg46nqaah5u', 'cmrexyd88006z7dg4mmsfs5m1', 'cmrexyd8b00717dg43gkbuxmi', 'cmrexyczv00157dg4srl96wh1', 'cmrexyd0d001l7dg4esjjfstz', 'DRIVER_TO_PASSENGER', 5, 'Passageiro(a) pontual e educado(a). Viagem tranquila!', '2026-06-02 11:20:00');
INSERT INTO public."Review" VALUES ('cmrexyd8o007h7dg410rejbu5', 'cmrexyd8h007a7dg4jvne66s8', 'cmrexyd8l007c7dg49opv0uoi', 'cmrexyd0g001n7dg4iodu8axl', 'cmrexyd05001e7dg488p1vgwn', 'PASSENGER_TO_DRIVER', 5, 'Carro novíssimo, banco de couro, parada em Canoa Quebrada. Parecia turismo de luxo.', '2026-05-28 16:15:00');
INSERT INTO public."Review" VALUES ('cmrexyd8q007j7dg4nnqvn5bk', 'cmrexyd8h007a7dg4jvne66s8', 'cmrexyd8l007c7dg49opv0uoi', 'cmrexyd05001e7dg488p1vgwn', 'cmrexyd0g001n7dg4iodu8axl', 'DRIVER_TO_PASSENGER', 5, 'Passageiro(a) pontual e educado(a). Viagem tranquila!', '2026-05-28 17:15:00');
INSERT INTO public."Review" VALUES ('cmrexyd8z007s7dg44gg8z7z1', 'cmrexyd8s007l7dg4hb350zu5', 'cmrexyd8w007n7dg4mk0zucb8', 'cmrexyd0a001k7dg46mfygl74', 'cmrexyd02001b7dg4au2mkw2n', 'PASSENGER_TO_DRIVER', 5, 'Viagem silenciosa de verdade — dormi de Recife a Garanhuns. Acordei na rodoviária.', '2026-05-23 18:21:00');
INSERT INTO public."Review" VALUES ('cmrexyd91007u7dg4n8dhcdjt', 'cmrexyd8s007l7dg4hb350zu5', 'cmrexyd8w007n7dg4mk0zucb8', 'cmrexyd02001b7dg4au2mkw2n', 'cmrexyd0a001k7dg46mfygl74', 'DRIVER_TO_PASSENGER', 5, 'Passageiro(a) pontual e educado(a). Viagem tranquila!', '2026-05-23 19:21:00');
INSERT INTO public."Review" VALUES ('cmrexyd9b00837dg4h3sxykzo', 'cmrexyd93007w7dg4tdbiqtdp', 'cmrexyd98007y7dg44gzzsruz', 'cmrexyd0h001o7dg47k5b8g6s', 'cmrexyd07001h7dg4uafb9fpm', 'PASSENGER_TO_DRIVER', 5, 'A Nina (cachorrinha) é a melhor copilota do Brasil. Aceitou minha gata a bordo sem drama.', '2026-05-18 13:25:00');
INSERT INTO public."Review" VALUES ('cmrexyd9c00857dg4agsxvt49', 'cmrexyd93007w7dg4tdbiqtdp', 'cmrexyd98007y7dg44gzzsruz', 'cmrexyd07001h7dg4uafb9fpm', 'cmrexyd0h001o7dg47k5b8g6s', 'DRIVER_TO_PASSENGER', 5, 'Passageiro(a) pontual e educado(a). Viagem tranquila!', '2026-05-18 14:25:00');
INSERT INTO public."Review" VALUES ('cmrexyd9m008e7dg41bhkxltz', 'cmrexyd9f00877dg4vdq1otux', 'cmrexyd9i00897dg4iqd41pqu', 'cmrexyd0d001l7dg4esjjfstz', 'cmrexyd07001h7dg4uafb9fpm', 'PASSENGER_TO_DRIVER', 4, 'Mala grande do violão coube tranquilo. Boa motorista.', '2026-05-13 13:25:00');
INSERT INTO public."Review" VALUES ('cmrexyd9o008g7dg4cnem2s3k', 'cmrexyd9f00877dg4vdq1otux', 'cmrexyd9i00897dg4iqd41pqu', 'cmrexyd07001h7dg4uafb9fpm', 'cmrexyd0d001l7dg4esjjfstz', 'DRIVER_TO_PASSENGER', 5, 'Passageiro(a) pontual e educado(a). Viagem tranquila!', '2026-05-13 14:25:00');


--
-- Data for Name: Trip; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Trip" VALUES ('cmrexyd1400287dg48trxxi04', 'cmrexyczi000w7dg4l529tmti', 'cmrexyd0j001q7dg40aud0ybz', 'PUBLISHED', 'Recife', 'PE', -8.0476, -34.877, 'Caruaru', 'PE', -8.2835, -35.976, '2026-07-15 06:00:00', '2026-07-15 08:04:00', 155, 124, 'Parque do Derby (em frente ao quiosque)', 'Rodoviária de Caruaru — plataforma externa', 'Saio da Zona Sul, pego a BR-232 sem pressa. Parada rápida no posto Bela Vista.', 4, 4, 4500, 'CONFORTO', '2026-07-10 12:58:10.168', '2026-07-10 12:58:10.168', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd17002a7dg4d3tjiqt5', 'cmrexyczi000w7dg4l529tmti', 'cmrexyd0j001q7dg40aud0ybz', 'PUBLISHED', 'Recife', 'PE', -8.0476, -34.877, 'Caruaru', 'PE', -8.2835, -35.976, '2026-07-19 06:00:00', '2026-07-19 08:04:00', 155, 124, 'Parque do Derby (em frente ao quiosque)', 'Rodoviária de Caruaru — plataforma externa', 'Saio da Zona Sul, pego a BR-232 sem pressa. Parada rápida no posto Bela Vista.', 4, 4, 4500, 'CONFORTO', '2026-07-10 12:58:10.171', '2026-07-10 12:58:10.171', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd1a002c7dg4rh1gtbay', 'cmrexyczi000w7dg4l529tmti', 'cmrexyd0j001q7dg40aud0ybz', 'PUBLISHED', 'Caruaru', 'PE', -8.2835, -35.976, 'Recife', 'PE', -8.0476, -34.877, '2026-07-12 17:15:00', '2026-07-12 19:19:00', 155, 124, 'Rodoviária de Caruaru — plataforma externa', 'Parque do Derby (em frente ao quiosque)', 'Volta no fim da tarde, chegando em Recife antes das 20h.', 4, 4, 4500, 'CONFORTO', '2026-07-10 12:58:10.175', '2026-07-10 12:58:10.175', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd1e002e7dg4otf7lxax', 'cmrexyczi000w7dg4l529tmti', 'cmrexyd0j001q7dg40aud0ybz', 'PUBLISHED', 'Caruaru', 'PE', -8.2835, -35.976, 'Recife', 'PE', -8.0476, -34.877, '2026-07-16 17:15:00', '2026-07-16 19:19:00', 155, 124, 'Rodoviária de Caruaru — plataforma externa', 'Parque do Derby (em frente ao quiosque)', 'Volta no fim da tarde, chegando em Recife antes das 20h.', 4, 4, 4500, 'CONFORTO', '2026-07-10 12:58:10.178', '2026-07-10 12:58:10.178', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd1i002g7dg44i4g0ea1', 'cmrexyczi000w7dg4l529tmti', 'cmrexyd0j001q7dg40aud0ybz', 'PUBLISHED', 'Caruaru', 'PE', -8.2835, -35.976, 'Recife', 'PE', -8.0476, -34.877, '2026-07-20 17:15:00', '2026-07-20 19:19:00', 155, 124, 'Rodoviária de Caruaru — plataforma externa', 'Parque do Derby (em frente ao quiosque)', 'Volta no fim da tarde, chegando em Recife antes das 20h.', 4, 4, 4500, 'CONFORTO', '2026-07-10 12:58:10.182', '2026-07-10 12:58:10.182', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd1m002i7dg4cbe9mia9', 'cmrexyczo000z7dg4dd2wvdwd', 'cmrexyd0l001s7dg4xqx2oydj', 'PUBLISHED', 'Campina Grande', 'PB', -7.2306, -35.8811, 'João Pessoa', 'PB', -7.1195, -34.845, '2026-07-13 07:30:00', '2026-07-13 09:25:00', 144, 115, 'Açude Velho (Monumento aos Pioneiros)', 'Busto de Tamandaré, Tambaú', 'Playlist de MPB e ar ligado. Embarque no Açude Velho.', 4, 4, 4000, 'CONFORTO', '2026-07-10 12:58:10.187', '2026-07-10 12:58:10.187', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd1r002k7dg4nvcepxsh', 'cmrexyczo000z7dg4dd2wvdwd', 'cmrexyd0l001s7dg4xqx2oydj', 'PUBLISHED', 'Campina Grande', 'PB', -7.2306, -35.8811, 'João Pessoa', 'PB', -7.1195, -34.845, '2026-07-17 07:30:00', '2026-07-17 09:25:00', 144, 115, 'Açude Velho (Monumento aos Pioneiros)', 'Busto de Tamandaré, Tambaú', 'Playlist de MPB e ar ligado. Embarque no Açude Velho.', 4, 4, 4000, 'CONFORTO', '2026-07-10 12:58:10.191', '2026-07-10 12:58:10.191', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd1u002m7dg4k9xvuapt', 'cmrexyczo000z7dg4dd2wvdwd', 'cmrexyd0l001s7dg4xqx2oydj', 'PUBLISHED', 'Campina Grande', 'PB', -7.2306, -35.8811, 'João Pessoa', 'PB', -7.1195, -34.845, '2026-07-21 07:30:00', '2026-07-21 09:25:00', 144, 115, 'Açude Velho (Monumento aos Pioneiros)', 'Busto de Tamandaré, Tambaú', 'Playlist de MPB e ar ligado. Embarque no Açude Velho.', 4, 4, 4000, 'CONFORTO', '2026-07-10 12:58:10.195', '2026-07-10 12:58:10.195', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd1y002o7dg4njn7pjrr', 'cmrexyczo000z7dg4dd2wvdwd', 'cmrexyd0l001s7dg4xqx2oydj', 'PUBLISHED', 'João Pessoa', 'PB', -7.1195, -34.845, 'Campina Grande', 'PB', -7.2306, -35.8811, '2026-07-14 18:00:00', '2026-07-14 19:55:00', 144, 115, 'Busto de Tamandaré, Tambaú', 'Açude Velho (Monumento aos Pioneiros)', 'Volto depois do expediente, saída pontual.', 4, 4, 4000, 'CONFORTO', '2026-07-10 12:58:10.198', '2026-07-10 12:58:10.198', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd21002q7dg4ffm1uwav', 'cmrexyczo000z7dg4dd2wvdwd', 'cmrexyd0l001s7dg4xqx2oydj', 'PUBLISHED', 'João Pessoa', 'PB', -7.1195, -34.845, 'Campina Grande', 'PB', -7.2306, -35.8811, '2026-07-18 18:00:00', '2026-07-18 19:55:00', 144, 115, 'Busto de Tamandaré, Tambaú', 'Açude Velho (Monumento aos Pioneiros)', 'Volto depois do expediente, saída pontual.', 4, 4, 4000, 'CONFORTO', '2026-07-10 12:58:10.201', '2026-07-10 12:58:10.201', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd24002s7dg4jx5a4lo1', 'cmrexyczo000z7dg4dd2wvdwd', 'cmrexyd0l001s7dg4xqx2oydj', 'PUBLISHED', 'João Pessoa', 'PB', -7.1195, -34.845, 'Campina Grande', 'PB', -7.2306, -35.8811, '2026-07-19 18:00:00', '2026-07-19 19:55:00', 144, 115, 'Busto de Tamandaré, Tambaú', 'Açude Velho (Monumento aos Pioneiros)', 'Volto depois do expediente, saída pontual.', 4, 4, 4000, 'CONFORTO', '2026-07-10 12:58:10.204', '2026-07-10 12:58:10.204', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd27002u7dg4mh5k5pyl', 'cmrexyczr00127dg4z2zrtemd', 'cmrexyd0n001u7dg4i0gzkjfx', 'PUBLISHED', 'Recife', 'PE', -8.0476, -34.877, 'João Pessoa', 'PB', -7.1195, -34.845, '2026-07-11 08:15:00', '2026-07-11 09:58:00', 129, 103, 'Parque do Derby (em frente ao quiosque)', 'Busto de Tamandaré, Tambaú', 'Compass com Wi-Fi e água gelada. Embarque no Shopping Recife ou Derby.', 4, 4, 6500, 'PREMIUM', '2026-07-10 12:58:10.208', '2026-07-10 12:58:10.208', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd2b002w7dg4mnmkpak1', 'cmrexyczr00127dg4z2zrtemd', 'cmrexyd0n001u7dg4i0gzkjfx', 'PUBLISHED', 'Recife', 'PE', -8.0476, -34.877, 'João Pessoa', 'PB', -7.1195, -34.845, '2026-07-15 08:15:00', '2026-07-15 09:58:00', 129, 103, 'Parque do Derby (em frente ao quiosque)', 'Busto de Tamandaré, Tambaú', 'Compass com Wi-Fi e água gelada. Embarque no Shopping Recife ou Derby.', 4, 4, 6500, 'PREMIUM', '2026-07-10 12:58:10.211', '2026-07-10 12:58:10.211', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd2f002y7dg4rjqnae3k', 'cmrexyczr00127dg4z2zrtemd', 'cmrexyd0n001u7dg4i0gzkjfx', 'PUBLISHED', 'Recife', 'PE', -8.0476, -34.877, 'João Pessoa', 'PB', -7.1195, -34.845, '2026-07-20 08:15:00', '2026-07-20 09:58:00', 129, 103, 'Parque do Derby (em frente ao quiosque)', 'Busto de Tamandaré, Tambaú', 'Compass com Wi-Fi e água gelada. Embarque no Shopping Recife ou Derby.', 4, 4, 6500, 'PREMIUM', '2026-07-10 12:58:10.215', '2026-07-10 12:58:10.215', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd2i00307dg4oxasd3lf', 'cmrexyczr00127dg4z2zrtemd', 'cmrexyd0n001u7dg4i0gzkjfx', 'PUBLISHED', 'Recife', 'PE', -8.0476, -34.877, 'Natal', 'RN', -5.7945, -35.211, '2026-07-12 06:30:00', '2026-07-12 10:44:00', 317, 254, 'Parque do Derby (em frente ao quiosque)', 'Midway Mall — entrada principal', 'Viagem direta pela BR-101, uma parada pra café em Mamanguape.', 4, 4, 12000, 'PREMIUM', '2026-07-10 12:58:10.219', '2026-07-10 12:58:10.219', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd2m00327dg40c9jfcf4', 'cmrexyczr00127dg4z2zrtemd', 'cmrexyd0n001u7dg4i0gzkjfx', 'PUBLISHED', 'Recife', 'PE', -8.0476, -34.877, 'Natal', 'RN', -5.7945, -35.211, '2026-07-16 06:30:00', '2026-07-16 10:44:00', 317, 254, 'Parque do Derby (em frente ao quiosque)', 'Midway Mall — entrada principal', 'Viagem direta pela BR-101, uma parada pra café em Mamanguape.', 4, 4, 12000, 'PREMIUM', '2026-07-10 12:58:10.222', '2026-07-10 12:58:10.222', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd2p00347dg4qsr25mqb', 'cmrexyczr00127dg4z2zrtemd', 'cmrexyd0n001u7dg4i0gzkjfx', 'PUBLISHED', 'Recife', 'PE', -8.0476, -34.877, 'Natal', 'RN', -5.7945, -35.211, '2026-07-21 06:30:00', '2026-07-21 10:44:00', 317, 254, 'Parque do Derby (em frente ao quiosque)', 'Midway Mall — entrada principal', 'Viagem direta pela BR-101, uma parada pra café em Mamanguape.', 4, 4, 12000, 'PREMIUM', '2026-07-10 12:58:10.225', '2026-07-10 12:58:10.225', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd2s00367dg46t0ii4ac', 'cmrexyczv00157dg4srl96wh1', 'cmrexyd0p001w7dg4o46kbumd', 'PUBLISHED', 'Recife', 'PE', -8.0476, -34.877, 'Maceió', 'AL', -9.6499, -35.7089, '2026-07-13 05:00:00', '2026-07-13 08:20:00', 250, 200, 'Parque do Derby (em frente ao quiosque)', 'Pajuçara, em frente ao Mercado do Artesanato', 'Saída cedinho pra pegar o nascer do sol na 101. Chegada antes do almoço.', 4, 4, 7500, 'CONFORTO', '2026-07-10 12:58:10.229', '2026-07-10 12:58:10.229', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd2v00387dg4io8mvw30', 'cmrexyczv00157dg4srl96wh1', 'cmrexyd0p001w7dg4o46kbumd', 'PUBLISHED', 'Recife', 'PE', -8.0476, -34.877, 'Maceió', 'AL', -9.6499, -35.7089, '2026-07-17 05:00:00', '2026-07-17 08:20:00', 250, 200, 'Parque do Derby (em frente ao quiosque)', 'Pajuçara, em frente ao Mercado do Artesanato', 'Saída cedinho pra pegar o nascer do sol na 101. Chegada antes do almoço.', 4, 4, 7500, 'CONFORTO', '2026-07-10 12:58:10.232', '2026-07-10 12:58:10.232', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd2z003a7dg4p9212cep', 'cmrexyczv00157dg4srl96wh1', 'cmrexyd0p001w7dg4o46kbumd', 'PUBLISHED', 'Recife', 'PE', -8.0476, -34.877, 'Maceió', 'AL', -9.6499, -35.7089, '2026-07-19 05:00:00', '2026-07-19 08:20:00', 250, 200, 'Parque do Derby (em frente ao quiosque)', 'Pajuçara, em frente ao Mercado do Artesanato', 'Saída cedinho pra pegar o nascer do sol na 101. Chegada antes do almoço.', 4, 4, 7500, 'CONFORTO', '2026-07-10 12:58:10.235', '2026-07-10 12:58:10.235', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd32003c7dg4zn6cvl6b', 'cmrexyczv00157dg4srl96wh1', 'cmrexyd0p001w7dg4o46kbumd', 'PUBLISHED', 'Maceió', 'AL', -9.6499, -35.7089, 'Recife', 'PE', -8.0476, -34.877, '2026-07-14 16:15:00', '2026-07-14 19:35:00', 250, 200, 'Pajuçara, em frente ao Mercado do Artesanato', 'Parque do Derby (em frente ao quiosque)', 'Volta no fim da tarde. Deixo no Derby ou Boa Viagem.', 4, 4, 7500, 'CONFORTO', '2026-07-10 12:58:10.238', '2026-07-10 12:58:10.238', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd35003e7dg4ne1hiw95', 'cmrexyczv00157dg4srl96wh1', 'cmrexyd0p001w7dg4o46kbumd', 'PUBLISHED', 'Maceió', 'AL', -9.6499, -35.7089, 'Recife', 'PE', -8.0476, -34.877, '2026-07-18 16:15:00', '2026-07-18 19:35:00', 250, 200, 'Pajuçara, em frente ao Mercado do Artesanato', 'Parque do Derby (em frente ao quiosque)', 'Volta no fim da tarde. Deixo no Derby ou Boa Viagem.', 4, 4, 7500, 'CONFORTO', '2026-07-10 12:58:10.242', '2026-07-10 12:58:10.242', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd38003g7dg4ee4fle29', 'cmrexyczv00157dg4srl96wh1', 'cmrexyd0p001w7dg4o46kbumd', 'PUBLISHED', 'Maceió', 'AL', -9.6499, -35.7089, 'Recife', 'PE', -8.0476, -34.877, '2026-07-20 16:15:00', '2026-07-20 19:35:00', 250, 200, 'Pajuçara, em frente ao Mercado do Artesanato', 'Parque do Derby (em frente ao quiosque)', 'Volta no fim da tarde. Deixo no Derby ou Boa Viagem.', 4, 4, 7500, 'CONFORTO', '2026-07-10 12:58:10.245', '2026-07-10 12:58:10.245', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd3c003i7dg49co31zkd', 'cmrexyczy00187dg4flee2c9m', 'cmrexyd0r001y7dg4a1qqghkq', 'PUBLISHED', 'Natal', 'RN', -5.7945, -35.211, 'Mossoró', 'RN', -5.1878, -37.3442, '2026-07-11 09:30:00', '2026-07-11 13:36:00', 307, 246, 'Midway Mall — entrada principal', 'Partage Shopping — entrada Leste', 'Spin com porta-malas grande — mala de viagem não é problema. Levo cadeirinha se avisar.', 4, 4, 5500, 'CONFORTO', '2026-07-10 12:58:10.248', '2026-07-10 12:58:10.248', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd3f003k7dg42d3nwzkj', 'cmrexyczy00187dg4flee2c9m', 'cmrexyd0r001y7dg4a1qqghkq', 'PUBLISHED', 'Natal', 'RN', -5.7945, -35.211, 'Mossoró', 'RN', -5.1878, -37.3442, '2026-07-15 09:30:00', '2026-07-15 13:36:00', 307, 246, 'Midway Mall — entrada principal', 'Partage Shopping — entrada Leste', 'Spin com porta-malas grande — mala de viagem não é problema. Levo cadeirinha se avisar.', 4, 4, 5500, 'CONFORTO', '2026-07-10 12:58:10.252', '2026-07-10 12:58:10.252', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd3j003m7dg4jsvrrgeg', 'cmrexyczy00187dg4flee2c9m', 'cmrexyd0r001y7dg4a1qqghkq', 'PUBLISHED', 'Natal', 'RN', -5.7945, -35.211, 'Mossoró', 'RN', -5.1878, -37.3442, '2026-07-21 09:30:00', '2026-07-21 13:36:00', 307, 246, 'Midway Mall — entrada principal', 'Partage Shopping — entrada Leste', 'Spin com porta-malas grande — mala de viagem não é problema. Levo cadeirinha se avisar.', 4, 4, 5500, 'CONFORTO', '2026-07-10 12:58:10.255', '2026-07-10 12:58:10.255', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd3m003o7dg4uh6734if', 'cmrexyd02001b7dg4au2mkw2n', 'cmrexyd0t00207dg42p97x2e9', 'PUBLISHED', 'Recife', 'PE', -8.0476, -34.877, 'Garanhuns', 'PE', -8.8903, -36.4928, '2026-07-12 13:00:00', '2026-07-12 16:21:00', 251, 201, 'Parque do Derby (em frente ao quiosque)', 'Praça Mestre Dominguinhos', 'Viagem silenciosa, ideal pra descansar. Saída da UFPE.', 3, 3, 5000, 'ECONOMICO', '2026-07-10 12:58:10.258', '2026-07-10 12:58:10.258', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd3p003q7dg4rkhyvjbm', 'cmrexyd02001b7dg4au2mkw2n', 'cmrexyd0t00207dg42p97x2e9', 'PUBLISHED', 'Recife', 'PE', -8.0476, -34.877, 'Garanhuns', 'PE', -8.8903, -36.4928, '2026-07-16 13:00:00', '2026-07-16 16:21:00', 251, 201, 'Parque do Derby (em frente ao quiosque)', 'Praça Mestre Dominguinhos', 'Viagem silenciosa, ideal pra descansar. Saída da UFPE.', 3, 3, 5000, 'ECONOMICO', '2026-07-10 12:58:10.261', '2026-07-10 12:58:10.261', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd3s003s7dg4x1srkuuk', 'cmrexyd02001b7dg4au2mkw2n', 'cmrexyd0t00207dg42p97x2e9', 'PUBLISHED', 'Recife', 'PE', -8.0476, -34.877, 'Garanhuns', 'PE', -8.8903, -36.4928, '2026-07-19 13:00:00', '2026-07-19 16:21:00', 251, 201, 'Parque do Derby (em frente ao quiosque)', 'Praça Mestre Dominguinhos', 'Viagem silenciosa, ideal pra descansar. Saída da UFPE.', 3, 3, 5000, 'ECONOMICO', '2026-07-10 12:58:10.264', '2026-07-10 12:58:10.264', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd3v003u7dg4diqh3hyt', 'cmrexyd05001e7dg488p1vgwn', 'cmrexyd0u00227dg40sizqrch', 'PUBLISHED', 'Fortaleza', 'CE', -3.7172, -38.5433, 'Natal', 'RN', -5.7945, -35.211, '2026-07-13 07:15:00', '2026-07-13 14:30:00', 544, 435, 'Shopping RioMar — piso L1', 'Midway Mall — entrada principal', 'Corolla Cross 2024, banco de couro. Parada pra almoço em Canoa Quebrada se a turma topar.', 4, 4, 13000, 'PREMIUM', '2026-07-10 12:58:10.267', '2026-07-10 12:58:10.267', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd3y003w7dg4cr1q6ubg', 'cmrexyd05001e7dg488p1vgwn', 'cmrexyd0u00227dg40sizqrch', 'PUBLISHED', 'Fortaleza', 'CE', -3.7172, -38.5433, 'Natal', 'RN', -5.7945, -35.211, '2026-07-17 07:15:00', '2026-07-17 14:30:00', 544, 435, 'Shopping RioMar — piso L1', 'Midway Mall — entrada principal', 'Corolla Cross 2024, banco de couro. Parada pra almoço em Canoa Quebrada se a turma topar.', 4, 4, 13000, 'PREMIUM', '2026-07-10 12:58:10.271', '2026-07-10 12:58:10.271', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd41003y7dg43lkrasyb', 'cmrexyd05001e7dg488p1vgwn', 'cmrexyd0u00227dg40sizqrch', 'PUBLISHED', 'Fortaleza', 'CE', -3.7172, -38.5433, 'Natal', 'RN', -5.7945, -35.211, '2026-07-20 07:15:00', '2026-07-20 14:30:00', 544, 435, 'Shopping RioMar — piso L1', 'Midway Mall — entrada principal', 'Corolla Cross 2024, banco de couro. Parada pra almoço em Canoa Quebrada se a turma topar.', 4, 4, 13000, 'PREMIUM', '2026-07-10 12:58:10.274', '2026-07-10 12:58:10.274', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd4500407dg4p8jjqkpu', 'cmrexyd05001e7dg488p1vgwn', 'cmrexyd0u00227dg40sizqrch', 'PUBLISHED', 'Natal', 'RN', -5.7945, -35.211, 'Fortaleza', 'CE', -3.7172, -38.5433, '2026-07-14 07:30:00', '2026-07-14 14:45:00', 544, 435, 'Midway Mall — entrada principal', 'Shopping RioMar — piso L1', 'Volta com o mesmo conforto. Wi-Fi a bordo pra quem precisa trabalhar.', 4, 4, 13000, 'PREMIUM', '2026-07-10 12:58:10.277', '2026-07-10 12:58:10.277', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd4800427dg4s825r6b0', 'cmrexyd05001e7dg488p1vgwn', 'cmrexyd0u00227dg40sizqrch', 'PUBLISHED', 'Natal', 'RN', -5.7945, -35.211, 'Fortaleza', 'CE', -3.7172, -38.5433, '2026-07-18 07:30:00', '2026-07-18 14:45:00', 544, 435, 'Midway Mall — entrada principal', 'Shopping RioMar — piso L1', 'Volta com o mesmo conforto. Wi-Fi a bordo pra quem precisa trabalhar.', 4, 4, 13000, 'PREMIUM', '2026-07-10 12:58:10.28', '2026-07-10 12:58:10.28', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd4c00447dg4sx4h7xh4', 'cmrexyd05001e7dg488p1vgwn', 'cmrexyd0u00227dg40sizqrch', 'PUBLISHED', 'Natal', 'RN', -5.7945, -35.211, 'Fortaleza', 'CE', -3.7172, -38.5433, '2026-07-21 07:30:00', '2026-07-21 14:45:00', 544, 435, 'Midway Mall — entrada principal', 'Shopping RioMar — piso L1', 'Volta com o mesmo conforto. Wi-Fi a bordo pra quem precisa trabalhar.', 4, 4, 13000, 'PREMIUM', '2026-07-10 12:58:10.284', '2026-07-10 12:58:10.284', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd4f00467dg43cxf4pyy', 'cmrexyd07001h7dg4uafb9fpm', 'cmrexyd0w00247dg4e1evef19', 'PUBLISHED', 'Maceió', 'AL', -9.6499, -35.7089, 'Aracaju', 'SE', -10.9095, -37.0748, '2026-07-11 08:00:00', '2026-07-11 11:25:00', 256, 205, 'Pajuçara, em frente ao Mercado do Artesanato', 'Orla de Atalaia — Oceanário', 'Aceito pet (a Nina aprova). Embarque na Pajuçara.', 4, 4, 6000, 'CONFORTO', '2026-07-10 12:58:10.287', '2026-07-10 12:58:10.287', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd4j00487dg441n6v5gq', 'cmrexyd07001h7dg4uafb9fpm', 'cmrexyd0w00247dg4e1evef19', 'PUBLISHED', 'Maceió', 'AL', -9.6499, -35.7089, 'Aracaju', 'SE', -10.9095, -37.0748, '2026-07-15 08:00:00', '2026-07-15 11:25:00', 256, 205, 'Pajuçara, em frente ao Mercado do Artesanato', 'Orla de Atalaia — Oceanário', 'Aceito pet (a Nina aprova). Embarque na Pajuçara.', 4, 4, 6000, 'CONFORTO', '2026-07-10 12:58:10.291', '2026-07-10 12:58:10.291', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd4z004a7dg4i3jhaj0x', 'cmrexyd07001h7dg4uafb9fpm', 'cmrexyd0w00247dg4e1evef19', 'PUBLISHED', 'Maceió', 'AL', -9.6499, -35.7089, 'Aracaju', 'SE', -10.9095, -37.0748, '2026-07-19 08:00:00', '2026-07-19 11:25:00', 256, 205, 'Pajuçara, em frente ao Mercado do Artesanato', 'Orla de Atalaia — Oceanário', 'Aceito pet (a Nina aprova). Embarque na Pajuçara.', 4, 4, 6000, 'CONFORTO', '2026-07-10 12:58:10.307', '2026-07-10 12:58:10.307', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd53004c7dg49xcjx93q', 'cmrexyd07001h7dg4uafb9fpm', 'cmrexyd0w00247dg4e1evef19', 'PUBLISHED', 'Maceió', 'AL', -9.6499, -35.7089, 'Recife', 'PE', -8.0476, -34.877, '2026-07-12 09:15:00', '2026-07-12 12:35:00', 250, 200, 'Pajuçara, em frente ao Mercado do Artesanato', 'Parque do Derby (em frente ao quiosque)', 'Fotógrafa a caminho de mais um casamento — mala grande cabe sim.', 4, 4, 7000, 'CONFORTO', '2026-07-10 12:58:10.311', '2026-07-10 12:58:10.311', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd57004e7dg4a34yozuq', 'cmrexyd07001h7dg4uafb9fpm', 'cmrexyd0w00247dg4e1evef19', 'PUBLISHED', 'Maceió', 'AL', -9.6499, -35.7089, 'Recife', 'PE', -8.0476, -34.877, '2026-07-16 09:15:00', '2026-07-16 12:35:00', 250, 200, 'Pajuçara, em frente ao Mercado do Artesanato', 'Parque do Derby (em frente ao quiosque)', 'Fotógrafa a caminho de mais um casamento — mala grande cabe sim.', 4, 4, 7000, 'CONFORTO', '2026-07-10 12:58:10.315', '2026-07-10 12:58:10.315', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd5b004g7dg484dmvdsd', 'cmrexyd07001h7dg4uafb9fpm', 'cmrexyd0w00247dg4e1evef19', 'PUBLISHED', 'Maceió', 'AL', -9.6499, -35.7089, 'Recife', 'PE', -8.0476, -34.877, '2026-07-20 09:15:00', '2026-07-20 12:35:00', 250, 200, 'Pajuçara, em frente ao Mercado do Artesanato', 'Parque do Derby (em frente ao quiosque)', 'Fotógrafa a caminho de mais um casamento — mala grande cabe sim.', 4, 4, 7000, 'CONFORTO', '2026-07-10 12:58:10.319', '2026-07-10 12:58:10.319', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd5f004i7dg4ygztr0xl', 'cmrexyczy00187dg4flee2c9m', 'cmrexyd0r001y7dg4a1qqghkq', 'PUBLISHED', 'Natal', 'RN', -5.7945, -35.211, 'Pipa', 'RN', -6.2283, -35.0458, '2026-07-13 08:30:00', '2026-07-13 09:21:00', 64, 51, 'Midway Mall — entrada principal', 'Entrada de Pipa (posto Ale)', 'Rota de praia! Deixo na entrada de Pipa ou no centrinho.', 4, 4, 3500, 'CONFORTO', '2026-07-10 12:58:10.323', '2026-07-10 12:58:10.323', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd5j004k7dg4v1onk7vx', 'cmrexyczy00187dg4flee2c9m', 'cmrexyd0r001y7dg4a1qqghkq', 'PUBLISHED', 'Natal', 'RN', -5.7945, -35.211, 'Pipa', 'RN', -6.2283, -35.0458, '2026-07-17 08:30:00', '2026-07-17 09:21:00', 64, 51, 'Midway Mall — entrada principal', 'Entrada de Pipa (posto Ale)', 'Rota de praia! Deixo na entrada de Pipa ou no centrinho.', 4, 4, 3500, 'CONFORTO', '2026-07-10 12:58:10.327', '2026-07-10 12:58:10.327', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd5n004m7dg43uqykgc8', 'cmrexyczy00187dg4flee2c9m', 'cmrexyd0r001y7dg4a1qqghkq', 'PUBLISHED', 'Natal', 'RN', -5.7945, -35.211, 'Pipa', 'RN', -6.2283, -35.0458, '2026-07-21 08:30:00', '2026-07-21 09:21:00', 64, 51, 'Midway Mall — entrada principal', 'Entrada de Pipa (posto Ale)', 'Rota de praia! Deixo na entrada de Pipa ou no centrinho.', 4, 4, 3500, 'CONFORTO', '2026-07-10 12:58:10.331', '2026-07-10 12:58:10.331', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd5r004o7dg4ijzj8cu9', 'cmrexyczr00127dg4z2zrtemd', 'cmrexyd0n001u7dg4i0gzkjfx', 'PUBLISHED', 'João Pessoa', 'PB', -7.1195, -34.845, 'Recife', 'PE', -8.0476, -34.877, '2026-07-14 19:00:00', '2026-07-14 20:43:00', 129, 103, 'Busto de Tamandaré, Tambaú', 'Parque do Derby (em frente ao quiosque)', 'Volta no início da noite, chegada no Derby.', 4, 4, 6500, 'PREMIUM', '2026-07-10 12:58:10.335', '2026-07-10 12:58:10.335', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd5v004q7dg4y3vm81iy', 'cmrexyczr00127dg4z2zrtemd', 'cmrexyd0n001u7dg4i0gzkjfx', 'PUBLISHED', 'João Pessoa', 'PB', -7.1195, -34.845, 'Recife', 'PE', -8.0476, -34.877, '2026-07-18 19:00:00', '2026-07-18 20:43:00', 129, 103, 'Busto de Tamandaré, Tambaú', 'Parque do Derby (em frente ao quiosque)', 'Volta no início da noite, chegada no Derby.', 4, 4, 6500, 'PREMIUM', '2026-07-10 12:58:10.339', '2026-07-10 12:58:10.339', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd5y004s7dg4n0l77txu', 'cmrexyczr00127dg4z2zrtemd', 'cmrexyd0n001u7dg4i0gzkjfx', 'PUBLISHED', 'João Pessoa', 'PB', -7.1195, -34.845, 'Recife', 'PE', -8.0476, -34.877, '2026-07-19 19:00:00', '2026-07-19 20:43:00', 129, 103, 'Busto de Tamandaré, Tambaú', 'Parque do Derby (em frente ao quiosque)', 'Volta no início da noite, chegada no Derby.', 4, 4, 6500, 'PREMIUM', '2026-07-10 12:58:10.343', '2026-07-10 12:58:10.343', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd63004u7dg4ktyezwra', 'cmrexyczi000w7dg4l529tmti', 'cmrexyd0j001q7dg40aud0ybz', 'COMPLETED', 'Recife', 'PE', -8.0476, -34.877, 'Caruaru', 'PE', -8.2835, -35.976, '2026-07-07 06:00:00', '2026-07-07 08:04:00', 155, 124, 'Parque do Derby (em frente ao quiosque)', NULL, NULL, 4, 3, 4500, 'CONFORTO', '2026-07-10 12:58:10.347', '2026-07-10 12:58:10.347', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd6h00557dg47nsmu8w6', 'cmrexyczi000w7dg4l529tmti', 'cmrexyd0j001q7dg40aud0ybz', 'COMPLETED', 'Recife', 'PE', -8.0476, -34.877, 'Caruaru', 'PE', -8.2835, -35.976, '2026-07-02 06:00:00', '2026-07-02 08:04:00', 155, 124, 'Parque do Derby (em frente ao quiosque)', NULL, NULL, 4, 3, 4500, 'CONFORTO', '2026-07-10 12:58:10.361', '2026-07-10 12:58:10.361', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd6s005g7dg4ztzm0qwi', 'cmrexyczi000w7dg4l529tmti', 'cmrexyd0j001q7dg40aud0ybz', 'COMPLETED', 'Recife', 'PE', -8.0476, -34.877, 'Caruaru', 'PE', -8.2835, -35.976, '2026-06-27 06:00:00', '2026-06-27 08:04:00', 155, 124, 'Parque do Derby (em frente ao quiosque)', NULL, NULL, 4, 3, 4500, 'CONFORTO', '2026-07-10 12:58:10.372', '2026-07-10 12:58:10.372', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd72005r7dg4fayy4dis', 'cmrexyczr00127dg4z2zrtemd', 'cmrexyd0n001u7dg4i0gzkjfx', 'COMPLETED', 'Recife', 'PE', -8.0476, -34.877, 'João Pessoa', 'PB', -7.1195, -34.845, '2026-06-22 08:00:00', '2026-06-22 09:43:00', 129, 103, 'Parque do Derby (em frente ao quiosque)', NULL, NULL, 4, 3, 6500, 'PREMIUM', '2026-07-10 12:58:10.382', '2026-07-10 12:58:10.382', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd7d00627dg4ctb2xjbj', 'cmrexyczr00127dg4z2zrtemd', 'cmrexyd0n001u7dg4i0gzkjfx', 'COMPLETED', 'Recife', 'PE', -8.0476, -34.877, 'João Pessoa', 'PB', -7.1195, -34.845, '2026-06-17 08:00:00', '2026-06-17 09:43:00', 129, 103, 'Parque do Derby (em frente ao quiosque)', NULL, NULL, 4, 3, 6500, 'PREMIUM', '2026-07-10 12:58:10.393', '2026-07-10 12:58:10.393', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd7o006d7dg4c1zg4qga', 'cmrexyczy00187dg4flee2c9m', 'cmrexyd0r001y7dg4a1qqghkq', 'COMPLETED', 'Natal', 'RN', -5.7945, -35.211, 'Mossoró', 'RN', -5.1878, -37.3442, '2026-06-12 09:00:00', '2026-06-12 13:06:00', 307, 246, 'Midway Mall — entrada principal', NULL, NULL, 4, 3, 5500, 'CONFORTO', '2026-07-10 12:58:10.405', '2026-07-10 12:58:10.405', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd7z006o7dg4kj15anr5', 'cmrexyczo000z7dg4dd2wvdwd', 'cmrexyd0l001s7dg4xqx2oydj', 'COMPLETED', 'Campina Grande', 'PB', -7.2306, -35.8811, 'João Pessoa', 'PB', -7.1195, -34.845, '2026-06-07 07:00:00', '2026-06-07 08:55:00', 144, 115, 'Açude Velho (Monumento aos Pioneiros)', NULL, NULL, 4, 3, 4000, 'CONFORTO', '2026-07-10 12:58:10.416', '2026-07-10 12:58:10.416', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd88006z7dg4mmsfs5m1', 'cmrexyczv00157dg4srl96wh1', 'cmrexyd0p001w7dg4o46kbumd', 'COMPLETED', 'Recife', 'PE', -8.0476, -34.877, 'Maceió', 'AL', -9.6499, -35.7089, '2026-06-02 05:00:00', '2026-06-02 08:20:00', 250, 200, 'Parque do Derby (em frente ao quiosque)', NULL, NULL, 4, 3, 7500, 'CONFORTO', '2026-07-10 12:58:10.424', '2026-07-10 12:58:10.424', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd8h007a7dg4jvne66s8', 'cmrexyd05001e7dg488p1vgwn', 'cmrexyd0u00227dg40sizqrch', 'COMPLETED', 'Fortaleza', 'CE', -3.7172, -38.5433, 'Natal', 'RN', -5.7945, -35.211, '2026-05-28 07:00:00', '2026-05-28 14:15:00', 544, 435, 'Shopping RioMar — piso L1', NULL, NULL, 4, 3, 13000, 'PREMIUM', '2026-07-10 12:58:10.434', '2026-07-10 12:58:10.434', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd8s007l7dg4hb350zu5', 'cmrexyd02001b7dg4au2mkw2n', 'cmrexyd0t00207dg42p97x2e9', 'COMPLETED', 'Recife', 'PE', -8.0476, -34.877, 'Garanhuns', 'PE', -8.8903, -36.4928, '2026-05-23 13:00:00', '2026-05-23 16:21:00', 251, 201, 'Parque do Derby (em frente ao quiosque)', NULL, NULL, 3, 2, 5000, 'ECONOMICO', '2026-07-10 12:58:10.445', '2026-07-10 12:58:10.445', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd93007w7dg4tdbiqtdp', 'cmrexyd07001h7dg4uafb9fpm', 'cmrexyd0w00247dg4e1evef19', 'COMPLETED', 'Maceió', 'AL', -9.6499, -35.7089, 'Aracaju', 'SE', -10.9095, -37.0748, '2026-05-18 08:00:00', '2026-05-18 11:25:00', 256, 205, 'Pajuçara, em frente ao Mercado do Artesanato', NULL, NULL, 4, 3, 6000, 'CONFORTO', '2026-07-10 12:58:10.456', '2026-07-10 12:58:10.456', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd9f00877dg4vdq1otux', 'cmrexyd07001h7dg4uafb9fpm', 'cmrexyd0w00247dg4e1evef19', 'COMPLETED', 'Maceió', 'AL', -9.6499, -35.7089, 'Aracaju', 'SE', -10.9095, -37.0748, '2026-05-13 08:00:00', '2026-05-13 11:25:00', 256, 205, 'Pajuçara, em frente ao Mercado do Artesanato', NULL, NULL, 4, 3, 6000, 'CONFORTO', '2026-07-10 12:58:10.467', '2026-07-10 12:58:10.467', NULL);
INSERT INTO public."Trip" VALUES ('cmrexyd0z00267dg4j1zgehrx', 'cmrexyczi000w7dg4l529tmti', 'cmrexyd0j001q7dg40aud0ybz', 'PUBLISHED', 'Recife', 'PE', -8.0476, -34.877, 'Caruaru', 'PE', -8.2835, -35.976, '2026-07-11 06:00:00', '2026-07-11 08:04:00', 155, 124, 'Parque do Derby (em frente ao quiosque)', 'Rodoviária de Caruaru — plataforma externa', 'Saio da Zona Sul, pego a BR-232 sem pressa. Parada rápida no posto Bela Vista.', 4, 3, 4500, 'CONFORTO', '2026-07-10 12:58:10.163', '2026-07-10 12:58:10.53', NULL);


--
-- Data for Name: TripAmenity; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."TripAmenity" VALUES ('cmrexyd0z00267dg4j1zgehrx', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd0z00267dg4j1zgehrx', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd0z00267dg4j1zgehrx', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd0z00267dg4j1zgehrx', 'cmrexyczd000q7dg4s8712zgp');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd0z00267dg4j1zgehrx', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1400287dg48trxxi04', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1400287dg48trxxi04', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1400287dg48trxxi04', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1400287dg48trxxi04', 'cmrexyczd000q7dg4s8712zgp');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1400287dg48trxxi04', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd17002a7dg4d3tjiqt5', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd17002a7dg4d3tjiqt5', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd17002a7dg4d3tjiqt5', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd17002a7dg4d3tjiqt5', 'cmrexyczd000q7dg4s8712zgp');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd17002a7dg4d3tjiqt5', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1a002c7dg4rh1gtbay', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1a002c7dg4rh1gtbay', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1a002c7dg4rh1gtbay', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1a002c7dg4rh1gtbay', 'cmrexyczd000q7dg4s8712zgp');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1a002c7dg4rh1gtbay', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1e002e7dg4otf7lxax', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1e002e7dg4otf7lxax', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1e002e7dg4otf7lxax', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1e002e7dg4otf7lxax', 'cmrexyczd000q7dg4s8712zgp');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1e002e7dg4otf7lxax', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1i002g7dg44i4g0ea1', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1i002g7dg44i4g0ea1', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1i002g7dg44i4g0ea1', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1i002g7dg44i4g0ea1', 'cmrexyczd000q7dg4s8712zgp');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1i002g7dg44i4g0ea1', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1m002i7dg4cbe9mia9', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1m002i7dg4cbe9mia9', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1m002i7dg4cbe9mia9', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1r002k7dg4nvcepxsh', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1r002k7dg4nvcepxsh', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1r002k7dg4nvcepxsh', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1u002m7dg4k9xvuapt', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1u002m7dg4k9xvuapt', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1u002m7dg4k9xvuapt', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1y002o7dg4njn7pjrr', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1y002o7dg4njn7pjrr', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd1y002o7dg4njn7pjrr', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd21002q7dg4ffm1uwav', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd21002q7dg4ffm1uwav', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd21002q7dg4ffm1uwav', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd24002s7dg4jx5a4lo1', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd24002s7dg4jx5a4lo1', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd24002s7dg4jx5a4lo1', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd27002u7dg4mh5k5pyl', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd27002u7dg4mh5k5pyl', 'cmrexyczd000l7dg4eqycl0zx');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd27002u7dg4mh5k5pyl', 'cmrexyczd000n7dg45qdmz3hf');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd27002u7dg4mh5k5pyl', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd27002u7dg4mh5k5pyl', 'cmrexyczd000t7dg4mppx5tet');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd27002u7dg4mh5k5pyl', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd27002u7dg4mh5k5pyl', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2b002w7dg4mnmkpak1', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2b002w7dg4mnmkpak1', 'cmrexyczd000l7dg4eqycl0zx');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2b002w7dg4mnmkpak1', 'cmrexyczd000n7dg45qdmz3hf');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2b002w7dg4mnmkpak1', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2b002w7dg4mnmkpak1', 'cmrexyczd000t7dg4mppx5tet');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2b002w7dg4mnmkpak1', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2b002w7dg4mnmkpak1', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2f002y7dg4rjqnae3k', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2f002y7dg4rjqnae3k', 'cmrexyczd000l7dg4eqycl0zx');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2f002y7dg4rjqnae3k', 'cmrexyczd000n7dg45qdmz3hf');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2f002y7dg4rjqnae3k', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2f002y7dg4rjqnae3k', 'cmrexyczd000t7dg4mppx5tet');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2f002y7dg4rjqnae3k', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2f002y7dg4rjqnae3k', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2i00307dg4oxasd3lf', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2i00307dg4oxasd3lf', 'cmrexyczd000l7dg4eqycl0zx');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2i00307dg4oxasd3lf', 'cmrexyczd000n7dg45qdmz3hf');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2i00307dg4oxasd3lf', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2i00307dg4oxasd3lf', 'cmrexyczd000t7dg4mppx5tet');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2i00307dg4oxasd3lf', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2i00307dg4oxasd3lf', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2m00327dg40c9jfcf4', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2m00327dg40c9jfcf4', 'cmrexyczd000l7dg4eqycl0zx');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2m00327dg40c9jfcf4', 'cmrexyczd000n7dg45qdmz3hf');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2m00327dg40c9jfcf4', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2m00327dg40c9jfcf4', 'cmrexyczd000t7dg4mppx5tet');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2m00327dg40c9jfcf4', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2m00327dg40c9jfcf4', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2p00347dg4qsr25mqb', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2p00347dg4qsr25mqb', 'cmrexyczd000l7dg4eqycl0zx');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2p00347dg4qsr25mqb', 'cmrexyczd000n7dg45qdmz3hf');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2p00347dg4qsr25mqb', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2p00347dg4qsr25mqb', 'cmrexyczd000t7dg4mppx5tet');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2p00347dg4qsr25mqb', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2p00347dg4qsr25mqb', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2s00367dg46t0ii4ac', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2s00367dg46t0ii4ac', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2s00367dg46t0ii4ac', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2s00367dg46t0ii4ac', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2s00367dg46t0ii4ac', 'cmrexyczd000l7dg4eqycl0zx');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2v00387dg4io8mvw30', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2v00387dg4io8mvw30', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2v00387dg4io8mvw30', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2v00387dg4io8mvw30', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2v00387dg4io8mvw30', 'cmrexyczd000l7dg4eqycl0zx');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2z003a7dg4p9212cep', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2z003a7dg4p9212cep', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2z003a7dg4p9212cep', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2z003a7dg4p9212cep', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd2z003a7dg4p9212cep', 'cmrexyczd000l7dg4eqycl0zx');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd32003c7dg4zn6cvl6b', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd32003c7dg4zn6cvl6b', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd32003c7dg4zn6cvl6b', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd32003c7dg4zn6cvl6b', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd32003c7dg4zn6cvl6b', 'cmrexyczd000l7dg4eqycl0zx');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd35003e7dg4ne1hiw95', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd35003e7dg4ne1hiw95', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd35003e7dg4ne1hiw95', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd35003e7dg4ne1hiw95', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd35003e7dg4ne1hiw95', 'cmrexyczd000l7dg4eqycl0zx');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd38003g7dg4ee4fle29', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd38003g7dg4ee4fle29', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd38003g7dg4ee4fle29', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd38003g7dg4ee4fle29', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd38003g7dg4ee4fle29', 'cmrexyczd000l7dg4eqycl0zx');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3c003i7dg49co31zkd', 'cmrexyczd000t7dg4mppx5tet');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3c003i7dg49co31zkd', 'cmrexyczd000q7dg4s8712zgp');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3c003i7dg49co31zkd', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3c003i7dg49co31zkd', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3c003i7dg49co31zkd', 'cmrexyczd000v7dg47sjempdu');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3f003k7dg42d3nwzkj', 'cmrexyczd000t7dg4mppx5tet');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3f003k7dg42d3nwzkj', 'cmrexyczd000q7dg4s8712zgp');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3f003k7dg42d3nwzkj', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3f003k7dg42d3nwzkj', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3f003k7dg42d3nwzkj', 'cmrexyczd000v7dg47sjempdu');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3j003m7dg4jsvrrgeg', 'cmrexyczd000t7dg4mppx5tet');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3j003m7dg4jsvrrgeg', 'cmrexyczd000q7dg4s8712zgp');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3j003m7dg4jsvrrgeg', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3j003m7dg4jsvrrgeg', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3j003m7dg4jsvrrgeg', 'cmrexyczd000v7dg47sjempdu');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3m003o7dg4uh6734if', 'cmrexyczd000p7dg4sqwpmc72');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3m003o7dg4uh6734if', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3m003o7dg4uh6734if', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3p003q7dg4rkhyvjbm', 'cmrexyczd000p7dg4sqwpmc72');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3p003q7dg4rkhyvjbm', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3p003q7dg4rkhyvjbm', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3s003s7dg4x1srkuuk', 'cmrexyczd000p7dg4sqwpmc72');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3s003s7dg4x1srkuuk', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3s003s7dg4x1srkuuk', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3v003u7dg4diqh3hyt', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3v003u7dg4diqh3hyt', 'cmrexyczd000l7dg4eqycl0zx');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3v003u7dg4diqh3hyt', 'cmrexyczd000n7dg45qdmz3hf');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3v003u7dg4diqh3hyt', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3v003u7dg4diqh3hyt', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3v003u7dg4diqh3hyt', 'cmrexyczd000t7dg4mppx5tet');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3v003u7dg4diqh3hyt', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3v003u7dg4diqh3hyt', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3y003w7dg4cr1q6ubg', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3y003w7dg4cr1q6ubg', 'cmrexyczd000l7dg4eqycl0zx');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3y003w7dg4cr1q6ubg', 'cmrexyczd000n7dg45qdmz3hf');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3y003w7dg4cr1q6ubg', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3y003w7dg4cr1q6ubg', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3y003w7dg4cr1q6ubg', 'cmrexyczd000t7dg4mppx5tet');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3y003w7dg4cr1q6ubg', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd3y003w7dg4cr1q6ubg', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd41003y7dg43lkrasyb', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd41003y7dg43lkrasyb', 'cmrexyczd000l7dg4eqycl0zx');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd41003y7dg43lkrasyb', 'cmrexyczd000n7dg45qdmz3hf');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd41003y7dg43lkrasyb', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd41003y7dg43lkrasyb', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd41003y7dg43lkrasyb', 'cmrexyczd000t7dg4mppx5tet');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd41003y7dg43lkrasyb', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd41003y7dg43lkrasyb', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4500407dg4p8jjqkpu', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4500407dg4p8jjqkpu', 'cmrexyczd000l7dg4eqycl0zx');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4500407dg4p8jjqkpu', 'cmrexyczd000n7dg45qdmz3hf');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4500407dg4p8jjqkpu', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4500407dg4p8jjqkpu', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4500407dg4p8jjqkpu', 'cmrexyczd000t7dg4mppx5tet');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4500407dg4p8jjqkpu', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4500407dg4p8jjqkpu', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4800427dg4s825r6b0', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4800427dg4s825r6b0', 'cmrexyczd000l7dg4eqycl0zx');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4800427dg4s825r6b0', 'cmrexyczd000n7dg45qdmz3hf');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4800427dg4s825r6b0', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4800427dg4s825r6b0', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4800427dg4s825r6b0', 'cmrexyczd000t7dg4mppx5tet');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4800427dg4s825r6b0', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4800427dg4s825r6b0', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4c00447dg4sx4h7xh4', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4c00447dg4sx4h7xh4', 'cmrexyczd000l7dg4eqycl0zx');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4c00447dg4sx4h7xh4', 'cmrexyczd000n7dg45qdmz3hf');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4c00447dg4sx4h7xh4', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4c00447dg4sx4h7xh4', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4c00447dg4sx4h7xh4', 'cmrexyczd000t7dg4mppx5tet');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4c00447dg4sx4h7xh4', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4c00447dg4sx4h7xh4', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4f00467dg43cxf4pyy', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4f00467dg43cxf4pyy', 'cmrexyczd000r7dg4lfbvlg8l');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4f00467dg43cxf4pyy', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4f00467dg43cxf4pyy', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4f00467dg43cxf4pyy', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4j00487dg441n6v5gq', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4j00487dg441n6v5gq', 'cmrexyczd000r7dg4lfbvlg8l');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4j00487dg441n6v5gq', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4j00487dg441n6v5gq', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4j00487dg441n6v5gq', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4z004a7dg4i3jhaj0x', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4z004a7dg4i3jhaj0x', 'cmrexyczd000r7dg4lfbvlg8l');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4z004a7dg4i3jhaj0x', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4z004a7dg4i3jhaj0x', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd4z004a7dg4i3jhaj0x', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd53004c7dg49xcjx93q', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd53004c7dg49xcjx93q', 'cmrexyczd000r7dg4lfbvlg8l');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd53004c7dg49xcjx93q', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd53004c7dg49xcjx93q', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd53004c7dg49xcjx93q', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd57004e7dg4a34yozuq', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd57004e7dg4a34yozuq', 'cmrexyczd000r7dg4lfbvlg8l');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd57004e7dg4a34yozuq', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd57004e7dg4a34yozuq', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd57004e7dg4a34yozuq', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5b004g7dg484dmvdsd', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5b004g7dg484dmvdsd', 'cmrexyczd000r7dg4lfbvlg8l');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5b004g7dg484dmvdsd', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5b004g7dg484dmvdsd', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5b004g7dg484dmvdsd', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5f004i7dg4ygztr0xl', 'cmrexyczd000t7dg4mppx5tet');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5f004i7dg4ygztr0xl', 'cmrexyczd000q7dg4s8712zgp');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5f004i7dg4ygztr0xl', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5f004i7dg4ygztr0xl', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5f004i7dg4ygztr0xl', 'cmrexyczd000v7dg47sjempdu');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5j004k7dg4v1onk7vx', 'cmrexyczd000t7dg4mppx5tet');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5j004k7dg4v1onk7vx', 'cmrexyczd000q7dg4s8712zgp');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5j004k7dg4v1onk7vx', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5j004k7dg4v1onk7vx', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5j004k7dg4v1onk7vx', 'cmrexyczd000v7dg47sjempdu');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5n004m7dg43uqykgc8', 'cmrexyczd000t7dg4mppx5tet');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5n004m7dg43uqykgc8', 'cmrexyczd000q7dg4s8712zgp');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5n004m7dg43uqykgc8', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5n004m7dg43uqykgc8', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5n004m7dg43uqykgc8', 'cmrexyczd000v7dg47sjempdu');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5r004o7dg4ijzj8cu9', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5r004o7dg4ijzj8cu9', 'cmrexyczd000l7dg4eqycl0zx');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5r004o7dg4ijzj8cu9', 'cmrexyczd000n7dg45qdmz3hf');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5r004o7dg4ijzj8cu9', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5r004o7dg4ijzj8cu9', 'cmrexyczd000t7dg4mppx5tet');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5r004o7dg4ijzj8cu9', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5r004o7dg4ijzj8cu9', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5v004q7dg4y3vm81iy', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5v004q7dg4y3vm81iy', 'cmrexyczd000l7dg4eqycl0zx');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5v004q7dg4y3vm81iy', 'cmrexyczd000n7dg45qdmz3hf');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5v004q7dg4y3vm81iy', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5v004q7dg4y3vm81iy', 'cmrexyczd000t7dg4mppx5tet');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5v004q7dg4y3vm81iy', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5v004q7dg4y3vm81iy', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5y004s7dg4n0l77txu', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5y004s7dg4n0l77txu', 'cmrexyczd000l7dg4eqycl0zx');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5y004s7dg4n0l77txu', 'cmrexyczd000n7dg45qdmz3hf');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5y004s7dg4n0l77txu', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5y004s7dg4n0l77txu', 'cmrexyczd000t7dg4mppx5tet');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5y004s7dg4n0l77txu', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd5y004s7dg4n0l77txu', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd63004u7dg4ktyezwra', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd63004u7dg4ktyezwra', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd63004u7dg4ktyezwra', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd63004u7dg4ktyezwra', 'cmrexyczd000q7dg4s8712zgp');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd63004u7dg4ktyezwra', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd6h00557dg47nsmu8w6', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd6h00557dg47nsmu8w6', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd6h00557dg47nsmu8w6', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd6h00557dg47nsmu8w6', 'cmrexyczd000q7dg4s8712zgp');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd6h00557dg47nsmu8w6', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd6s005g7dg4ztzm0qwi', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd6s005g7dg4ztzm0qwi', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd6s005g7dg4ztzm0qwi', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd6s005g7dg4ztzm0qwi', 'cmrexyczd000q7dg4s8712zgp');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd6s005g7dg4ztzm0qwi', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd72005r7dg4fayy4dis', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd72005r7dg4fayy4dis', 'cmrexyczd000l7dg4eqycl0zx');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd72005r7dg4fayy4dis', 'cmrexyczd000n7dg45qdmz3hf');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd72005r7dg4fayy4dis', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd72005r7dg4fayy4dis', 'cmrexyczd000t7dg4mppx5tet');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd72005r7dg4fayy4dis', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd72005r7dg4fayy4dis', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd7d00627dg4ctb2xjbj', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd7d00627dg4ctb2xjbj', 'cmrexyczd000l7dg4eqycl0zx');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd7d00627dg4ctb2xjbj', 'cmrexyczd000n7dg45qdmz3hf');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd7d00627dg4ctb2xjbj', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd7d00627dg4ctb2xjbj', 'cmrexyczd000t7dg4mppx5tet');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd7d00627dg4ctb2xjbj', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd7d00627dg4ctb2xjbj', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd7o006d7dg4c1zg4qga', 'cmrexyczd000t7dg4mppx5tet');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd7o006d7dg4c1zg4qga', 'cmrexyczd000q7dg4s8712zgp');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd7o006d7dg4c1zg4qga', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd7o006d7dg4c1zg4qga', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd7o006d7dg4c1zg4qga', 'cmrexyczd000v7dg47sjempdu');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd7z006o7dg4kj15anr5', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd7z006o7dg4kj15anr5', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd7z006o7dg4kj15anr5', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd88006z7dg4mmsfs5m1', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd88006z7dg4mmsfs5m1', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd88006z7dg4mmsfs5m1', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd88006z7dg4mmsfs5m1', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd88006z7dg4mmsfs5m1', 'cmrexyczd000l7dg4eqycl0zx');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd8h007a7dg4jvne66s8', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd8h007a7dg4jvne66s8', 'cmrexyczd000l7dg4eqycl0zx');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd8h007a7dg4jvne66s8', 'cmrexyczd000n7dg45qdmz3hf');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd8h007a7dg4jvne66s8', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd8h007a7dg4jvne66s8', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd8h007a7dg4jvne66s8', 'cmrexyczd000t7dg4mppx5tet');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd8h007a7dg4jvne66s8', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd8h007a7dg4jvne66s8', 'cmrexyczd000o7dg4dj0pjaf9');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd8s007l7dg4hb350zu5', 'cmrexyczd000p7dg4sqwpmc72');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd8s007l7dg4hb350zu5', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd8s007l7dg4hb350zu5', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd93007w7dg4tdbiqtdp', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd93007w7dg4tdbiqtdp', 'cmrexyczd000r7dg4lfbvlg8l');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd93007w7dg4tdbiqtdp', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd93007w7dg4tdbiqtdp', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd93007w7dg4tdbiqtdp', 'cmrexyczd000s7dg4ontip2ak');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd9f00877dg4vdq1otux', 'cmrexyczd000k7dg4ip1299kw');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd9f00877dg4vdq1otux', 'cmrexyczd000r7dg4lfbvlg8l');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd9f00877dg4vdq1otux', 'cmrexyczd000m7dg4i6sutc78');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd9f00877dg4vdq1otux', 'cmrexyczd000u7dg4i06rscqz');
INSERT INTO public."TripAmenity" VALUES ('cmrexyd9f00877dg4vdq1otux', 'cmrexyczd000s7dg4ontip2ak');


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."User" VALUES ('cmrexyczi000w7dg4l529tmti', 'João Andrade', 'motorista@trip.dev', '2026-07-10 12:58:10.109', '$2b$10$kM0HPPQlTEzdn99.0vQBoOZI.5RCjdl6UwOl6SrxSzeDzYRnvGkLe', '+55 81 913267635', '2026-07-10 12:58:10.109', NULL, 'Faço Recife–Caruaru toda semana a trabalho. Dirijo há 12 anos, zero multas. Café na Pousada do Ló é parada obrigatória.', '2026-07-10 12:58:10.111', '2026-07-10 12:58:10.482', 'VERIFIED', NULL, NULL, 4.666666666666667, 3, 0, 0, NULL);
INSERT INTO public."User" VALUES ('cmrexyczo000z7dg4dd2wvdwd', 'Carla Menezes', 'carla@trip.dev', '2026-07-10 12:58:10.115', '$2b$10$kM0HPPQlTEzdn99.0vQBoOZI.5RCjdl6UwOl6SrxSzeDzYRnvGkLe', '+55 81 914431305', '2026-07-10 12:58:10.115', NULL, 'Professora em Campina, família em João Pessoa. Viagem tranquila, playlist de MPB e ar sempre ligado.', '2026-07-10 12:58:10.116', '2026-07-10 12:58:10.486', 'VERIFIED', NULL, NULL, 5, 1, 0, 0, NULL);
INSERT INTO public."User" VALUES ('cmrexyczr00127dg4z2zrtemd', 'Rafael Duarte', 'rafael@trip.dev', '2026-07-10 12:58:10.119', '$2b$10$kM0HPPQlTEzdn99.0vQBoOZI.5RCjdl6UwOl6SrxSzeDzYRnvGkLe', '+55 81 948527407', '2026-07-10 12:58:10.119', NULL, 'Representante comercial. Rodo o litoral todo mês — Compass confortável, Wi-Fi e água gelada pra todo mundo.', '2026-07-10 12:58:10.12', '2026-07-10 12:58:10.489', 'VERIFIED', NULL, NULL, 5, 2, 0, 0, NULL);
INSERT INTO public."User" VALUES ('cmrexyczv00157dg4srl96wh1', 'Ana Beatriz Lima', 'ana@trip.dev', '2026-07-10 12:58:10.122', '$2b$10$kM0HPPQlTEzdn99.0vQBoOZI.5RCjdl6UwOl6SrxSzeDzYRnvGkLe', '+55 81 910096724', '2026-07-10 12:58:10.122', NULL, 'Desço pra Maceió quase todo fim de semana. Gosto de sair cedinho pra pegar o nascer do sol na BR-101.', '2026-07-10 12:58:10.123', '2026-07-10 12:58:10.493', 'VERIFIED', NULL, NULL, 4, 1, 0, 0, NULL);
INSERT INTO public."User" VALUES ('cmrexyczy00187dg4flee2c9m', 'Marcos Paulo', 'marcos@trip.dev', '2026-07-10 12:58:10.126', '$2b$10$kM0HPPQlTEzdn99.0vQBoOZI.5RCjdl6UwOl6SrxSzeDzYRnvGkLe', '+55 81 911313431', '2026-07-10 12:58:10.126', NULL, 'Motorista aposentado do transporte escolar. Paciência de Jó, direção defensiva e muita história boa.', '2026-07-10 12:58:10.127', '2026-07-10 12:58:10.496', 'VERIFIED', NULL, NULL, 5, 1, 0, 0, NULL);
INSERT INTO public."User" VALUES ('cmrexyd02001b7dg4au2mkw2n', 'Júlia Sarmento', 'julia@trip.dev', '2026-07-10 12:58:10.129', '$2b$10$kM0HPPQlTEzdn99.0vQBoOZI.5RCjdl6UwOl6SrxSzeDzYRnvGkLe', '+55 81 921485913', '2026-07-10 12:58:10.129', NULL, 'Estudante de medicina, volto pra Garanhuns nas folgas. Viagem silenciosa: ideal pra quem quer dormir.', '2026-07-10 12:58:10.13', '2026-07-10 12:58:10.5', 'VERIFIED', NULL, NULL, 5, 1, 0, 0, NULL);
INSERT INTO public."User" VALUES ('cmrexyd05001e7dg488p1vgwn', 'Pedro Cavalcanti', 'pedro@trip.dev', '2026-07-10 12:58:10.132', '$2b$10$kM0HPPQlTEzdn99.0vQBoOZI.5RCjdl6UwOl6SrxSzeDzYRnvGkLe', '+55 81 926542988', '2026-07-10 12:58:10.132', NULL, 'Fortaleza–Natal com estilo: SUV nova, banco de couro, cafezinho na Canoa Quebrada quando dá tempo.', '2026-07-10 12:58:10.133', '2026-07-10 12:58:10.504', 'VERIFIED', NULL, NULL, 5, 1, 0, 0, NULL);
INSERT INTO public."User" VALUES ('cmrexyd07001h7dg4uafb9fpm', 'Lívia Rocha', 'livia@trip.dev', '2026-07-10 12:58:10.135', '$2b$10$kM0HPPQlTEzdn99.0vQBoOZI.5RCjdl6UwOl6SrxSzeDzYRnvGkLe', '+55 81 922985073', '2026-07-10 12:58:10.135', NULL, 'Fotógrafa de casamentos rodando o NE. Aceito pet de boa — a Nina (vira-lata caramelo) às vezes vai junto.', '2026-07-10 12:58:10.136', '2026-07-10 12:58:10.507', 'VERIFIED', NULL, NULL, 4.5, 2, 0, 0, NULL);
INSERT INTO public."User" VALUES ('cmrexyd0a001k7dg46mfygl74', 'Marina Figueiredo', 'passageiro@trip.dev', '2026-07-10 12:58:10.138', '$2b$10$kM0HPPQlTEzdn99.0vQBoOZI.5RCjdl6UwOl6SrxSzeDzYRnvGkLe', NULL, NULL, NULL, 'Viajo entre Recife e o interior quase toda semana. Prefiro viagens com ar e pouca conversa.', '2026-07-10 12:58:10.139', '2026-07-10 12:58:10.511', 'VERIFIED', NULL, NULL, 0, 0, 5, 3, NULL);
INSERT INTO public."User" VALUES ('cmrexyd0d001l7dg4esjjfstz', 'Tiago Nunes', 'tiago@trip.dev', '2026-07-10 12:58:10.14', '$2b$10$kM0HPPQlTEzdn99.0vQBoOZI.5RCjdl6UwOl6SrxSzeDzYRnvGkLe', NULL, NULL, NULL, 'Músico, sempre com um violão na mala.', '2026-07-10 12:58:10.141', '2026-07-10 12:58:10.516', 'UNVERIFIED', NULL, NULL, 0, 0, 5, 3, NULL);
INSERT INTO public."User" VALUES ('cmrexyd0e001m7dg4kkyovkgx', 'Bruna Carvalho', 'bruna@trip.dev', '2026-07-10 12:58:10.142', '$2b$10$kM0HPPQlTEzdn99.0vQBoOZI.5RCjdl6UwOl6SrxSzeDzYRnvGkLe', NULL, NULL, NULL, 'Analista de RH em João Pessoa.', '2026-07-10 12:58:10.143', '2026-07-10 12:58:10.519', 'UNVERIFIED', NULL, NULL, 0, 0, 5, 2, NULL);
INSERT INTO public."User" VALUES ('cmrexyd0g001n7dg4iodu8axl', 'Felipe Souza', 'felipe@trip.dev', '2026-07-10 12:58:10.144', '$2b$10$kM0HPPQlTEzdn99.0vQBoOZI.5RCjdl6UwOl6SrxSzeDzYRnvGkLe', NULL, NULL, NULL, 'Estudante da UFRN.', '2026-07-10 12:58:10.144', '2026-07-10 12:58:10.523', 'UNVERIFIED', NULL, NULL, 0, 0, 5, 2, NULL);
INSERT INTO public."User" VALUES ('cmrexyd0h001o7dg47k5b8g6s', 'Renata Alves', 'renata@trip.dev', '2026-07-10 12:58:10.145', '$2b$10$kM0HPPQlTEzdn99.0vQBoOZI.5RCjdl6UwOl6SrxSzeDzYRnvGkLe', NULL, NULL, NULL, 'Enfermeira, plantões em Natal e família em Mossoró.', '2026-07-10 12:58:10.146', '2026-07-10 12:58:10.527', 'UNVERIFIED', NULL, NULL, 0, 0, 5, 2, NULL);


--
-- Data for Name: Vehicle; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Vehicle" VALUES ('cmrexyd0j001q7dg40aud0ybz', 'cmrexyczi000w7dg4l529tmti', 'Chevrolet', 'Onix', 2021, 'Prata', 'KJT2B47', 'HATCH', 4, '{}', '2026-07-10 12:58:10.147');
INSERT INTO public."Vehicle" VALUES ('cmrexyd0l001s7dg4xqx2oydj', 'cmrexyczo000z7dg4dd2wvdwd', 'Fiat', 'Argo', 2019, 'Vermelho', 'QSD8C12', 'HATCH', 4, '{}', '2026-07-10 12:58:10.15');
INSERT INTO public."Vehicle" VALUES ('cmrexyd0n001u7dg4i0gzkjfx', 'cmrexyczr00127dg4z2zrtemd', 'Jeep', 'Compass', 2023, 'Cinza grafite', 'RFP4E88', 'SUV', 4, '{}', '2026-07-10 12:58:10.152');
INSERT INTO public."Vehicle" VALUES ('cmrexyd0p001w7dg4o46kbumd', 'cmrexyczv00157dg4srl96wh1', 'Volkswagen', 'Virtus', 2022, 'Branco', 'PGH7A03', 'SEDAN', 4, '{}', '2026-07-10 12:58:10.154');
INSERT INTO public."Vehicle" VALUES ('cmrexyd0r001y7dg4a1qqghkq', 'cmrexyczy00187dg4flee2c9m', 'Chevrolet', 'Spin', 2019, 'Prata', 'NQZ3D55', 'MINIVAN', 6, '{}', '2026-07-10 12:58:10.155');
INSERT INTO public."Vehicle" VALUES ('cmrexyd0t00207dg42p97x2e9', 'cmrexyd02001b7dg4au2mkw2n', 'Fiat', 'Mobi', 2018, 'Azul', 'KHV9F21', 'HATCH', 3, '{}', '2026-07-10 12:58:10.157');
INSERT INTO public."Vehicle" VALUES ('cmrexyd0u00227dg40sizqrch', 'cmrexyd05001e7dg488p1vgwn', 'Toyota', 'Corolla Cross', 2024, 'Preto', 'SBC1G09', 'SUV', 4, '{}', '2026-07-10 12:58:10.159');
INSERT INTO public."Vehicle" VALUES ('cmrexyd0w00247dg4e1evef19', 'cmrexyd07001h7dg4uafb9fpm', 'Hyundai', 'HB20S', 2020, 'Branco', 'ORM6H74', 'SEDAN', 4, '{}', '2026-07-10 12:58:10.16');


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public._prisma_migrations VALUES ('2ef1aa9e-94e7-4847-bdc9-c9e0a1d941d7', '952872c0e0fd24e02af78ce66a7d543eed47d5da7b3a7f94e17f4e9b5eed63b6', '2026-07-10 12:52:55.94943+00', '20260710125255_init', NULL, NULL, '2026-07-10 12:52:55.770626+00', 1);


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: Amenity Amenity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Amenity"
    ADD CONSTRAINT "Amenity_pkey" PRIMARY KEY (id);


--
-- Name: Booking Booking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_pkey" PRIMARY KEY (id);


--
-- Name: City City_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."City"
    ADD CONSTRAINT "City_pkey" PRIMARY KEY (id);


--
-- Name: Conversation Conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_pkey" PRIMARY KEY (id);


--
-- Name: DriverProfile DriverProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DriverProfile"
    ADD CONSTRAINT "DriverProfile_pkey" PRIMARY KEY (id);


--
-- Name: Favorite Favorite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId", "tripId");


--
-- Name: IdentityVerification IdentityVerification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IdentityVerification"
    ADD CONSTRAINT "IdentityVerification_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: Payout Payout_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payout"
    ADD CONSTRAINT "Payout_pkey" PRIMARY KEY (id);


--
-- Name: Report Report_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_pkey" PRIMARY KEY (id);


--
-- Name: Review Review_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_pkey" PRIMARY KEY (id);


--
-- Name: TripAmenity TripAmenity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TripAmenity"
    ADD CONSTRAINT "TripAmenity_pkey" PRIMARY KEY ("tripId", "amenityId");


--
-- Name: Trip Trip_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Trip"
    ADD CONSTRAINT "Trip_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Vehicle Vehicle_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Vehicle"
    ADD CONSTRAINT "Vehicle_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON public."Account" USING btree (provider, "providerAccountId");


--
-- Name: Amenity_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Amenity_slug_key" ON public."Amenity" USING btree (slug);


--
-- Name: Booking_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Booking_code_key" ON public."Booking" USING btree (code);


--
-- Name: Booking_passengerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Booking_passengerId_idx" ON public."Booking" USING btree ("passengerId");


--
-- Name: Booking_shareToken_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Booking_shareToken_key" ON public."Booking" USING btree ("shareToken");


--
-- Name: Booking_tripId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Booking_tripId_idx" ON public."Booking" USING btree ("tripId");


--
-- Name: City_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "City_name_idx" ON public."City" USING btree (name);


--
-- Name: City_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "City_slug_key" ON public."City" USING btree (slug);


--
-- Name: Conversation_driverId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Conversation_driverId_idx" ON public."Conversation" USING btree ("driverId");


--
-- Name: Conversation_passengerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Conversation_passengerId_idx" ON public."Conversation" USING btree ("passengerId");


--
-- Name: Conversation_tripId_passengerId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Conversation_tripId_passengerId_key" ON public."Conversation" USING btree ("tripId", "passengerId");


--
-- Name: DriverProfile_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "DriverProfile_userId_key" ON public."DriverProfile" USING btree ("userId");


--
-- Name: IdentityVerification_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IdentityVerification_userId_idx" ON public."IdentityVerification" USING btree ("userId");


--
-- Name: Message_conversationId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Message_conversationId_createdAt_idx" ON public."Message" USING btree ("conversationId", "createdAt");


--
-- Name: Payment_bookingId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Payment_bookingId_key" ON public."Payment" USING btree ("bookingId");


--
-- Name: Payment_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Payment_status_idx" ON public."Payment" USING btree (status);


--
-- Name: Payout_bookingId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Payout_bookingId_key" ON public."Payout" USING btree ("bookingId");


--
-- Name: Payout_driverId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Payout_driverId_status_idx" ON public."Payout" USING btree ("driverId", status);


--
-- Name: Report_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Report_status_idx" ON public."Report" USING btree (status);


--
-- Name: Review_bookingId_authorId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Review_bookingId_authorId_key" ON public."Review" USING btree ("bookingId", "authorId");


--
-- Name: Review_targetId_direction_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Review_targetId_direction_idx" ON public."Review" USING btree ("targetId", direction);


--
-- Name: Trip_driverId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Trip_driverId_idx" ON public."Trip" USING btree ("driverId");


--
-- Name: Trip_originCity_destCity_departAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Trip_originCity_destCity_departAt_idx" ON public."Trip" USING btree ("originCity", "destCity", "departAt");


--
-- Name: Trip_status_departAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Trip_status_departAt_idx" ON public."Trip" USING btree (status, "departAt");


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Vehicle_ownerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Vehicle_ownerId_idx" ON public."Vehicle" USING btree ("ownerId");


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Booking Booking_passengerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Booking Booking_tripId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES public."Trip"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Conversation Conversation_driverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Conversation Conversation_passengerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Conversation Conversation_tripId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES public."Trip"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DriverProfile DriverProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DriverProfile"
    ADD CONSTRAINT "DriverProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Favorite Favorite_tripId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES public."Trip"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Favorite Favorite_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: IdentityVerification IdentityVerification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IdentityVerification"
    ADD CONSTRAINT "IdentityVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payment Payment_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public."Booking"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payout Payout_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payout"
    ADD CONSTRAINT "Payout_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public."Booking"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payout Payout_driverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payout"
    ADD CONSTRAINT "Payout_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Report Report_reporterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Report Report_targetUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public."Booking"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_targetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_tripId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES public."Trip"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TripAmenity TripAmenity_amenityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TripAmenity"
    ADD CONSTRAINT "TripAmenity_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES public."Amenity"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TripAmenity TripAmenity_tripId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TripAmenity"
    ADD CONSTRAINT "TripAmenity_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES public."Trip"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Trip Trip_driverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Trip"
    ADD CONSTRAINT "Trip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Trip Trip_vehicleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Trip"
    ADD CONSTRAINT "Trip_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES public."Vehicle"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Vehicle Vehicle_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Vehicle"
    ADD CONSTRAINT "Vehicle_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

