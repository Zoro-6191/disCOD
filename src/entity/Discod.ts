import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

// @Index("id", ["id"], { unique: true })
@Index("b3_id", ["b3Id"], { unique: true })
@Index("dc_id", ["dcId"], { unique: true })
@Index("dc_tag", ["dc_tag"], {})
// @Index("time_add", ["time_add"], {})
@Entity("discod")
export class Discod {

    @PrimaryGeneratedColumn({ 
        type: "int", 
        name: "id" 
    })
    id: number;

    @Column("int", { 
        name: "b3_id", 
        nullable: false,
        unique: true 
    })
    b3Id: number;

    @Column("varchar", { 
        name: "dc_id", 
        unique: true, 
        length: 32 
    })
    dcId: string;

    @Column("varchar", { 
        name: "dc_tag", 
        length: 32 
    })
    dc_tag: string;

    @Column("varchar", { 
        name: "pass", 
        length: 12 
    })
    pass: string;

    @Column("tinyint", { 
        name: "linked", 
        default: () => "'0'" 
    })
    linked: number;

    @Column({ 
        type: "timestamp",
        name: "linktime", 
        default: () => "'0'" 
    })
    linktime: number;

    @CreateDateColumn({ 
        type: "timestamp",
        name: "time_add", 
        unsigned: true,
    })
    time_add: number;
}
