CREATE TABLE meter_readings (
id uuid DEFAULT gen_random_uuid() NOT NULL,
"nmi" varchar(10) NOT NULL,
"timestamp" TIMESTAMP NULL NULL,
"consumption" NUMERIC NOT NULL,
constraint meter_readings_pk PRIMARY KEY (id),
constraint meter_readings_unique_consumption UNIQUE ("nmi", "timestamp")
);