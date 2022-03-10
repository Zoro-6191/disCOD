import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("ipalias", ["ip", "client_id"], { unique: true })
@Index("client_id", ["client_id"], {})
@Entity("ipaliases")
export class Ipaliases 
{
    @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
    id: number;

    @Column("int", { name: "num_used", unsigned: true, default: () => "'0'" })
    num_used: number;

    @Column("varchar", { name: "ip", length: 16 })
    ip: string;

    @Column("int", { name: "client_id", unsigned: true, default: () => "'0'" })
    client_id: number;

    @Column("int", { name: "time_add", unsigned: true, default: () => "'0'" })
    time_add: number;

    @Column("int", { name: "time_edit", unsigned: true, default: () => "'0'" })
    time_edit: number;
}
