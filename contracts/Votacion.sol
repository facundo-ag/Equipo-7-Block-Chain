// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Votacion {
    address public admin; // Autoridad electoral (ej. el que despliega el contrato)

    struct Opcion {
        uint256 id;
        string nombre;
        uint256 votos;
    }

    Opcion[] public opciones;
    mapping(address => bool) public haVotado;
    
    // SPRINT 2: Módulo de Registro y Elegibilidad
    // Este mapping guarda quién ha sido validado (DNI, edad, residencia)
    mapping(address => bool) public padronElectoral;

    // Eventos para auditoría
    event VotanteHabilitado(address votante);
    event VotoEmitido(address votante, uint256 opcionId);

    constructor() {
        admin = msg.sender; // El que crea el contrato es el administrador
    }

    // Restringe funciones solo para la autoridad electoral
    modifier soloAdmin() {
        require(msg.sender == admin, "No tienes permisos de administrador");
        _;
    }

    // SPRINT 2: Función para registrar ciudadanos tras verificar requisitos
    function habilitarVotante(address _votante) public soloAdmin {
        require(!padronElectoral[_votante], "El votante ya esta habilitado");
        padronElectoral[_votante] = true;
        emit VotanteHabilitado(_votante);
    }

    // Solo el admin puede agregar opciones (candidatos)
    function agregarOpcion(string memory nombre) public soloAdmin {
        uint256 opcionId = opciones.length;
        opciones.push(Opcion(opcionId, nombre, 0));
    }

    // Emisión de voto con doble verificación
    function emitirVoto(uint256 opcionId) public {
        // 1. Verificación de identidad/elegibilidad
        require(padronElectoral[msg.sender], "No estas registrado en el padron electoral");
        
        // 2. Verificación de integridad (un solo voto)
        require(!haVotado[msg.sender], "Ya has emitido tu voto");
        
        require(opcionId < opciones.length, "Opcion de voto no valida");

        opciones[opcionId].votos++;
        haVotado[msg.sender] = true;

        emit VotoEmitido(msg.sender, opcionId);
    }

    function consultarRecuentoVotos(uint256 opcionId) public view returns (uint256) {
        require(opcionId < opciones.length, "Opcion de voto no valida");
        return opciones[opcionId].votos;
    }

    function totalOpciones() public view returns (uint256) {
        return opciones.length;
    }
}
