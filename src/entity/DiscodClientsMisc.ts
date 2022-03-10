import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("client_id", ["client_id"], { unique: true })
@Entity("discod_clients_misc")
export class DiscodClientsMisc 
{
    @PrimaryGeneratedColumn({ type: "int", name: "id" })
    id: number;

    @Column("int", { name: "client_id", unique: true })
    client_id: number;

    @Column("varchar", {
        name: "steam_id",
        nullable: true,
        length: 36,
        default: () => "'0'",
    })
    steam_id: string | null;

    @Column("varchar", { name: "reso", nullable: true, length: 10 })
    reso: string | null;

    @Column("int", { name: "time_add" })
    time_add: number;

    @Column("int", { name: "time_edit" })
    time_edit: number;
}
