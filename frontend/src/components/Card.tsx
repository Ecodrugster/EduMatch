import React from 'react';
import styled from 'styled-components';
import { Project } from '../types';

const CardContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
  }
`;

const Title = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #e0f7fa;
`;

const Description = styled.p`
  color: #cfd8dc;
  margin: 0 0 0.5rem 0;
`;

const Skills = styled.ul`
  list-style: none;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const SkillItem = styled.li`
  background: rgba(255, 255, 255, 0.2);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #fafafa;
`;

const DeleteButton = styled.button`
  background: #ff5252;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.3rem 0.6rem;
  cursor: pointer;
  margin-top: 1rem;
  &:hover {
    background: #d32f2f;
  }
`;

interface CardProps {
  project: Project;
  onSelect?: (project: Project) => void;
  onDelete?: () => void;
}

export const Card: React.FC<CardProps> = ({ project, onSelect, onDelete }) => {
  const handleClick = () => {
    if (onSelect) onSelect(project);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete();
  };

    return (
        <CardContainer onClick={handleClick} role="button">
            <Title>{project.title}</Title>
            <Description>{project.description}</Description>
            {project.skillsRequired && project.skillsRequired.length > 0 && (
                <Skills>
                    {project.skillsRequired.map((skill, idx) => (
                        <SkillItem key={idx}>{skill}</SkillItem>
                    ))}
                </Skills>
            )}
            {/* Delete button */}
            <DeleteButton onClick={handleDelete}>Удалить</DeleteButton>
        </CardContainer>
    );
};
