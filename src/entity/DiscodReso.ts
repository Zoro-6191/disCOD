import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("id", ["id"], { unique: true })
@Index("client_id", ["client_id"], { unique: true })
@Entity("discod_reso")
export class DiscodReso 
{
    @PrimaryGeneratedColumn({ type: "int", name: "id" })
    id: number;

    @Column("int", { name: "client_id", unique: true })
    client_id: number;

    @Column("varchar", { name: "reso", length: 10 })
    reso: string;

    @Column("int", { name: "time_add", default: () => "'0'" })
    time_add: number;

    @Column("int", { name: "time_edit", default: () => "'0'" })
    time_edit: number;
}
